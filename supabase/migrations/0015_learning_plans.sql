-- ============================================================================
-- 0015 — Learning plans
--
-- The tutor lays out a plan for each student: an ordered run of units, each
-- with dates and a handful of objectives ("I can complete the square").
-- Progress is two separate signals that are never blended:
--
--   * The student's self-check: a confidence per objective (0–2).
--   * The tutor's mastery rating per unit: not started / developing / secure.
--
-- To help the student keep a rhythm, every day they do something counts as a
-- study day: a self-check, a hand-in, or an explicitly logged session. The app
-- turns those into a weekly goal and a streak. Study days are written only by
-- the database, dated in the student's own timezone, so none can be backfilled.
--
-- Tasks can point at a unit (`assignments.plan_unit_id`) so they show under it.
-- That link is for display only and feeds neither progress signal.
-- ============================================================================

create type public.plan_mastery as enum ('not_started', 'developing', 'secure');

-- ── Plans ───────────────────────────────────────────────────────────────────

create table public.learning_plans (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null unique references public.profiles (id) on delete cascade,
  title             text not null,
  goal              text,
  starts_on         date not null,
  ends_on           date not null,
  weekly_goal_days  smallint not null default 3,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint learning_plans_title_length
    check (length(trim(title)) between 1 and 200),
  constraint learning_plans_goal_length
    check (goal is null or length(goal) <= 5000),
  constraint learning_plans_ordered
    check (starts_on <= ends_on),
  constraint learning_plans_weekly_goal
    check (weekly_goal_days between 1 and 7)
);

create trigger learning_plans_touch_updated_at
  before update on public.learning_plans
  for each row execute function private.touch_updated_at();

comment on table public.learning_plans is
  'One plan per student, written by the tutor.';
comment on column public.learning_plans.weekly_goal_days is
  'How many study days a week the student aims for. Drives the streak.';

-- ── Units ───────────────────────────────────────────────────────────────────

create table public.plan_units (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.learning_plans (id) on delete cascade,
  position      integer not null,
  title         text not null,
  category_id   uuid references public.categories (id) on delete set null,
  description   text,
  starts_on     date not null,
  due_on        date not null,
  mastery       public.plan_mastery not null default 'not_started',
  mastery_note  text,
  mastered_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint plan_units_title_length
    check (length(trim(title)) between 1 and 200),
  constraint plan_units_description_length
    check (description is null or length(description) <= 5000),
  constraint plan_units_note_length
    check (mastery_note is null or length(mastery_note) <= 2000),
  constraint plan_units_ordered
    check (starts_on <= due_on),
  -- Deferred so two units can swap places in one transaction.
  constraint plan_units_position_unique
    unique (plan_id, position) deferrable initially deferred
);

create index plan_units_due_idx on public.plan_units (due_on);

create trigger plan_units_touch_updated_at
  before update on public.plan_units
  for each row execute function private.touch_updated_at();

-- `mastered_at` is when the rating last changed, stamped here so it is true.
create function private.stamp_unit_mastery()
returns trigger
language plpgsql
set search_path = private, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' or new.mastery is distinct from old.mastery then
    new.mastered_at := case when new.mastery = 'not_started' then null else now() end;
  else
    new.mastered_at := old.mastered_at;
  end if;
  return new;
end;
$$;

create trigger plan_units_stamp_mastery
  before insert or update on public.plan_units
  for each row execute function private.stamp_unit_mastery();

comment on column public.plan_units.mastery is
  'The tutor''s rating. Separate from the student''s self-check.';

-- ── Objectives ──────────────────────────────────────────────────────────────

create table public.plan_objectives (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references public.plan_units (id) on delete cascade,
  position    integer not null,
  statement   text not null,
  confidence  smallint not null default 0,
  checked_at  timestamptz,
  created_at  timestamptz not null default now(),

  constraint plan_objectives_statement_length
    check (length(trim(statement)) between 1 and 300),
  constraint plan_objectives_confidence
    check (confidence between 0 and 2)
);

create index plan_objectives_unit_idx on public.plan_objectives (unit_id, position);

comment on column public.plan_objectives.confidence is
  'The student''s self-check: 0 not yet, 1 getting there, 2 confident.';

-- ── Who owns what ───────────────────────────────────────────────────────────

create function private.plan_student(p_plan_id uuid)
returns uuid
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select student_id from public.learning_plans where id = p_plan_id;
$$;

create function private.unit_student(p_unit_id uuid)
returns uuid
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select p.student_id
    from public.plan_units u
    join public.learning_plans p on p.id = u.plan_id
   where u.id = p_unit_id;
$$;

revoke all on function private.plan_student(uuid) from public, anon, authenticated;
revoke all on function private.unit_student(uuid) from public, anon, authenticated;
grant execute on function private.plan_student(uuid) to authenticated;
grant execute on function private.unit_student(uuid) to authenticated;

-- ── Study days ──────────────────────────────────────────────────────────────

create table public.study_days (
  student_id  uuid not null references public.profiles (id) on delete cascade,
  day         date not null,
  sources     text[] not null default '{}',
  primary key (student_id, day),

  constraint study_days_sources
    check (sources <@ array['self_check', 'hand_in', 'session']::text[])
);

comment on table public.study_days is
  'Days a student did something. Written only by triggers, dated in their timezone.';

create function private.record_study_day(p_student uuid, p_source text)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  local_day date;
begin
  select (now() at time zone coalesce(timezone, 'Europe/London'))::date
    into local_day
    from public.profiles
   where id = p_student and role = 'student';

  if local_day is null then
    return;
  end if;

  insert into public.study_days (student_id, day, sources)
  values (p_student, local_day, array[p_source])
  on conflict (student_id, day) do update
    set sources = case
      when p_source = any (study_days.sources) then study_days.sources
      else study_days.sources || p_source
    end;
end;
$$;

revoke all on function private.record_study_day(uuid, text) from public, anon, authenticated;

-- A student may log a session for today, and only today.
create function public.log_study_session()
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if auth.uid() is null or private.is_tutor() then
    raise exception 'not permitted';
  end if;
  perform private.record_study_day(auth.uid(), 'session');
end;
$$;

revoke all on function public.log_study_session() from public, anon;
grant execute on function public.log_study_session() to authenticated;

-- ── Guard: students may only set their confidence ───────────────────────────

create function private.guard_objective_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if private.is_tutor() then
    return new;
  end if;

  if private.unit_student(old.unit_id) is distinct from auth.uid() then
    raise exception 'not permitted';
  end if;

  new.id := old.id;
  new.unit_id := old.unit_id;
  new.position := old.position;
  new.statement := old.statement;
  new.created_at := old.created_at;

  if new.confidence is distinct from old.confidence then
    new.checked_at := now();
    perform private.record_study_day(auth.uid(), 'self_check');
  else
    new.checked_at := old.checked_at;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_objective_update() from public, anon, authenticated;

create trigger plan_objectives_guard_update
  before update on public.plan_objectives
  for each row execute function private.guard_objective_update();

-- ── Hand-ins count as study days ────────────────────────────────────────────

create function private.hand_in_records_study_day()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if new.submitted_at is not null
     and new.submitted_at is distinct from old.submitted_at
  then
    perform private.record_study_day(new.student_id, 'hand_in');
  end if;
  return new;
end;
$$;

revoke all on function private.hand_in_records_study_day() from public, anon, authenticated;

create trigger assignments_hand_in_records_study_day
  after update of submitted_at on public.assignments
  for each row execute function private.hand_in_records_study_day();

-- ── Tasks can sit under a unit ──────────────────────────────────────────────

alter table public.assignments
  add column plan_unit_id uuid references public.plan_units (id) on delete set null;

create index assignments_plan_unit_idx
  on public.assignments (plan_unit_id)
  where plan_unit_id is not null;

comment on column public.assignments.plan_unit_id is
  'The plan unit this task belongs to. Display only.';

-- The student guard (0014) must also freeze the new column.
create or replace function private.guard_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if private.is_tutor() then
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
  new.plan_unit_id := old.plan_unit_id;
  new.due_at := old.due_at;
  new.created_at := old.created_at;

  -- The verdict, and what the tutor wrote with it, are the tutor's alone.
  new.reviewed_at := old.reviewed_at;
  new.verdict := old.verdict;
  new.feedback := old.feedback;

  -- Bookkeeping for assignments_resubmission_reopens_review, which runs after
  -- this trigger and is the only thing allowed to write it.
  new.superseded_submitted_at := old.superseded_submitted_at;
  new.superseded_reviewed_at := old.superseded_reviewed_at;
  new.superseded_verdict := old.superseded_verdict;
  new.superseded_feedback := old.superseded_feedback;

  -- Once reviewed, a hand-in is part of the feedback record and cannot be
  -- taken back.
  if old.reviewed_at is not null and new.submitted_at is null then
    new.submitted_at := old.submitted_at;
  end if;

  -- An open receipt is written once and never rewritten, so a student cannot
  -- backdate it to look like they opened the task earlier than they did.
  if old.student_opened_at is not null then
    new.student_opened_at := old.student_opened_at;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_assignment_update() from public, anon, authenticated;

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.learning_plans  enable row level security;
alter table public.plan_units      enable row level security;
alter table public.plan_objectives enable row level security;
alter table public.study_days      enable row level security;

create policy "plans readable by their student"
  on public.learning_plans for select to authenticated
  using (student_id = (select auth.uid()));

create policy "plans managed by tutor"
  on public.learning_plans for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());

create policy "plan units readable by their student"
  on public.plan_units for select to authenticated
  using (private.plan_student(plan_id) = (select auth.uid()));

create policy "plan units managed by tutor"
  on public.plan_units for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());

create policy "objectives readable by their student"
  on public.plan_objectives for select to authenticated
  using (private.unit_student(unit_id) = (select auth.uid()));

-- Allowed at the row level, then narrowed to `confidence` by the guard.
create policy "objectives self-checked by their student"
  on public.plan_objectives for update to authenticated
  using (private.unit_student(unit_id) = (select auth.uid()))
  with check (private.unit_student(unit_id) = (select auth.uid()));

create policy "objectives managed by tutor"
  on public.plan_objectives for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());

-- No insert/update/delete policies: only the security-definer triggers write.
create policy "study days readable by their student"
  on public.study_days for select to authenticated
  using (student_id = (select auth.uid()));

create policy "study days readable by tutor"
  on public.study_days for select to authenticated
  using (private.is_tutor());
