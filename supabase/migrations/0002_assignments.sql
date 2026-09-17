-- ============================================================================
-- 0002 — Assignments, materials, submissions, discussion
--
-- The lifecycle is Assigned → Opened → Submitted → Reviewed. Those stages are
-- DERIVED from timestamps rather than stored as a status column, which keeps
-- the tutor's verdict cleanly separate from the student's self-reported
-- progress — the one is evidence, the other is opinion, and conflating them in
-- a single enum is what makes review workflows drift out of sync.
-- ============================================================================

create type public.assignment_type as enum ('problem_set', 'reading_notes');
create type public.review_verdict  as enum ('approved', 'changes_requested');

-- ── assignments ─────────────────────────────────────────────────────────────

create table public.assignments (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid not null references public.profiles (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  type         public.assignment_type not null default 'problem_set',
  title        text not null,
  -- Markdown, with $…$ / $$…$$ maths rendered by KaTeX on the client.
  description  text,
  category_id  uuid references public.categories (id) on delete set null,
  due_at       timestamptz not null,

  -- Student's own sense of how far through they are. Never set by the tutor.
  completion_pct integer not null default 0,

  -- Lifecycle evidence.
  student_opened_at timestamptz,
  submitted_at      timestamptz,
  reviewed_at       timestamptz,
  verdict           public.review_verdict,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint assignments_title_not_blank check (length(trim(title)) > 0),
  constraint assignments_completion_range check (completion_pct between 0 and 100),
  -- A verdict and a review timestamp are two halves of the same fact.
  constraint assignments_verdict_paired check (
    (reviewed_at is null) = (verdict is null)
  )
);

-- Derived so every consumer — list filters, the calendar, the dashboard —
-- agrees on what stage a task is at, without each re-deriving it.
alter table public.assignments
  add column stage text
  generated always as (
    case
      when reviewed_at is not null then 'reviewed'
      when submitted_at is not null then 'submitted'
      when student_opened_at is not null then 'opened'
      else 'assigned'
    end
  ) stored;

create index assignments_student_due_idx on public.assignments (student_id, due_at desc);
create index assignments_tutor_created_idx on public.assignments (tutor_id, created_at desc);
create index assignments_stage_idx on public.assignments (stage);
create index assignments_due_at_idx on public.assignments (due_at);
create index assignments_category_idx on public.assignments (category_id);

create trigger assignments_touch_updated_at
  before update on public.assignments
  for each row execute function public.touch_updated_at();

comment on column public.assignments.stage is
  'Derived lifecycle stage: assigned | opened | submitted | reviewed.';
comment on column public.assignments.completion_pct is
  'Student self-report. Deliberately independent of the tutor verdict.';

-- ── assignment_files ────────────────────────────────────────────────────────

create table public.assignment_files (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  storage_path  text not null,
  file_name     text not null default '',
  mime_type     text not null,
  size_bytes    bigint,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint assignment_files_mime_allowed check (
    mime_type in ('application/pdf', 'image/png', 'image/jpeg')
  ),
  constraint assignment_files_size_limit check (
    size_bytes is null or size_bytes <= 20971520
  )
);

create index assignment_files_assignment_idx
  on public.assignment_files (assignment_id, sort_order);

-- ── submissions ─────────────────────────────────────────────────────────────

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  -- Revisions stack rather than overwrite: a returned piece of work and its
  -- redo are both part of the record.
  revision      integer not null default 1,
  storage_path  text not null,
  file_name     text not null default '',
  mime_type     text not null,
  size_bytes    bigint,
  created_at    timestamptz not null default now(),
  constraint submissions_mime_allowed check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png')
  ),
  constraint submissions_size_limit check (
    size_bytes is null or size_bytes <= 20971520
  )
);

create index submissions_assignment_idx
  on public.submissions (assignment_id, revision desc, created_at desc);

-- ── comments ────────────────────────────────────────────────────────────────

create table public.comments (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  author_id     uuid not null references public.profiles (id) on delete cascade,
  body          text not null,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz,
  -- Soft delete, so realtime subscribers receive a tombstone they can render
  -- rather than silently losing a row they are already showing.
  deleted_at    timestamptz,
  constraint comments_body_not_blank check (length(trim(body)) > 0)
);

create index comments_assignment_idx on public.comments (assignment_id, created_at);

-- ── Helper: may the current user see this assignment? ────────────────────────
--
-- SECURITY DEFINER so child-table policies can ask the question without needing
-- their own SELECT permission on `assignments`.

create function public.can_access_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.assignments a
    where a.id = p_assignment_id
      and (a.student_id = auth.uid() or a.tutor_id = auth.uid())
  );
$$;

revoke execute on function public.can_access_assignment(uuid) from public;
grant execute on function public.can_access_assignment(uuid) to authenticated;

-- ── Student write guard ─────────────────────────────────────────────────────
--
-- RLS grants or denies a whole row; it cannot say "this role may change these
-- three columns". A student legitimately needs to update their own assignment
-- row — to record an open receipt, report progress, and mark work submitted —
-- so the row-level policy allows the update and this trigger restores every
-- column they must not touch.

create function public.guard_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_tutor() then
    return new;
  end if;

  if old.student_id <> auth.uid() then
    raise exception 'not permitted';
  end if;

  new.id := old.id;
  new.tutor_id := old.tutor_id;
  new.student_id := old.student_id;
  new.type := old.type;
  new.title := old.title;
  new.description := old.description;
  new.category_id := old.category_id;
  new.due_at := old.due_at;
  new.created_at := old.created_at;

  -- The verdict is the tutor's alone.
  new.reviewed_at := old.reviewed_at;
  new.verdict := old.verdict;

  -- An open receipt is written once and never rewritten, so a student cannot
  -- rewrite history to look like they opened the task earlier than they did.
  if old.student_opened_at is not null then
    new.student_opened_at := old.student_opened_at;
  end if;

  return new;
end;
$$;

create trigger assignments_guard_update
  before update on public.assignments
  for each row execute function public.guard_assignment_update();

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.assignments      enable row level security;
alter table public.assignment_files enable row level security;
alter table public.submissions      enable row level security;
alter table public.comments         enable row level security;

-- assignments
create policy "assignments readable by their student"
  on public.assignments for select to authenticated
  using (student_id = auth.uid());

create policy "assignments readable by tutor"
  on public.assignments for select to authenticated
  using (public.is_tutor());

create policy "assignments created by tutor"
  on public.assignments for insert to authenticated
  with check (public.is_tutor() and tutor_id = auth.uid());

create policy "assignments updatable by tutor"
  on public.assignments for update to authenticated
  using (public.is_tutor())
  with check (public.is_tutor());

-- Allowed at the row level, then narrowed to the permitted columns by
-- guard_assignment_update().
create policy "assignments progress updatable by their student"
  on public.assignments for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "assignments deletable by tutor"
  on public.assignments for delete to authenticated
  using (public.is_tutor());

-- assignment_files
create policy "assignment files readable by participants"
  on public.assignment_files for select to authenticated
  using (public.can_access_assignment(assignment_id));

create policy "assignment files writable by tutor"
  on public.assignment_files for all to authenticated
  using (public.is_tutor())
  with check (public.is_tutor());

-- submissions
create policy "submissions readable by participants"
  on public.submissions for select to authenticated
  using (public.can_access_assignment(assignment_id));

create policy "submissions created by their student"
  on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid() and public.can_access_assignment(assignment_id)
  );

-- A student may withdraw their own work, but not after it has been reviewed —
-- at that point it is part of the feedback record.
create policy "submissions removable by their student before review"
  on public.submissions for delete to authenticated
  using (
    student_id = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.reviewed_at is null
    )
  );

create policy "submissions removable by tutor"
  on public.submissions for delete to authenticated
  using (public.is_tutor());

-- comments
create policy "comments readable by participants"
  on public.comments for select to authenticated
  using (public.can_access_assignment(assignment_id));

create policy "comments created by participants"
  on public.comments for insert to authenticated
  with check (
    author_id = auth.uid() and public.can_access_assignment(assignment_id)
  );

create policy "comments editable by their author"
  on public.comments for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments deletable by their author"
  on public.comments for delete to authenticated
  using (author_id = auth.uid());
