-- ============================================================================
-- 0020 — Syllabus tracker progress
--
-- One row per student per subtopic they have something recorded for. A
-- missing row reads as "to see, no stars, not scheduled", so a new student's
-- tracker is empty until the tutor (or an imported plan) fills it in.
--
-- Everything here is the tutor's: status, stars (0–5, how well the student
-- knows it), the planned window and notes. The student reads their own rows.
-- ============================================================================

create type public.topic_status as enum ('to_see', 'in_progress', 'seen');

create table public.topic_progress (
  student_id     uuid not null references public.profiles (id) on delete cascade,
  topic_id       uuid not null references public.syllabus_topics (id) on delete restrict,
  status         public.topic_status not null default 'to_see',
  stars          smallint not null default 0,
  planned_start  date,
  planned_end    date,
  notes          text,
  seen_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (student_id, topic_id),

  constraint topic_progress_stars check (stars between 0 and 5),
  constraint topic_progress_window check (
    planned_start is null or planned_end is null or planned_start <= planned_end
  ),
  -- A plan is for a term or a year; a longer window is a typo.
  constraint topic_progress_window_length check (
    planned_start is null or planned_end is null or planned_end - planned_start <= 366
  ),
  constraint topic_progress_notes_length check (notes is null or length(notes) <= 2000)
);

create index topic_progress_window_idx
  on public.topic_progress (planned_start, planned_end)
  where planned_start is not null or planned_end is not null;

create trigger topic_progress_touch_updated_at
  before update on public.topic_progress
  for each row execute function private.touch_updated_at();

comment on table public.topic_progress is
  'The tutor''s record of each syllabus subtopic for a student. Missing row = to see, 0 stars, unscheduled.';
comment on column public.topic_progress.stars is
  'How well the student knows it, 0–5, in the tutor''s judgement.';
comment on column public.topic_progress.seen_at is
  'When the status last became seen. Stamped by the database.';

-- New rows must be in the student's course; `seen_at` is stamped here so it's true.
create function private.guard_topic_progress()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and not exists (
    select 1
      from public.profiles p
      join public.syllabus_topics t on t.id = new.topic_id
     where p.id = new.student_id
       and p.role = 'student'
       and t.course = p.course
       and (t.level = 'SL' or p.level = 'HL')
  ) then
    raise exception 'topic is not in this student''s course';
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.seen_at := case when new.status = 'seen' then now() else null end;
  else
    new.seen_at := old.seen_at;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_topic_progress() from public, anon, authenticated;

create trigger topic_progress_guard
  before insert or update on public.topic_progress
  for each row execute function private.guard_topic_progress();

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.topic_progress enable row level security;

create policy "topic progress readable by its student"
  on public.topic_progress for select to authenticated
  using (student_id = (select auth.uid()));

create policy "topic progress managed by tutor"
  on public.topic_progress for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());
