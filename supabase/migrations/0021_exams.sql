-- ============================================================================
-- 0021 — Class exams
--
-- The exams a student sits at school, with how they went: a percentage and an
-- IB grade (1–7), both optional so an exam can be added before it happens.
-- Each exam can be tagged with the syllabus subtopics it covered.
--
-- Unlike the tracker, exams belong to the student as much as the tutor: the
-- student adds, edits and deletes their own; the tutor can do the same for any
-- student. Nobody else sees them.
-- ============================================================================

create table public.exams (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  exam_date   date not null,
  title       text not null,
  percent     numeric(5, 2),
  ib_grade    smallint,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint exams_title_length check (length(btrim(title)) between 1 and 200),
  constraint exams_percent_range check (percent is null or percent between 0 and 100),
  constraint exams_ib_grade_range check (ib_grade is null or ib_grade between 1 and 7),
  constraint exams_notes_length check (notes is null or length(notes) <= 2000)
);

create index exams_student_date_idx on public.exams (student_id, exam_date);

create trigger exams_touch_updated_at
  before update on public.exams
  for each row execute function private.touch_updated_at();

comment on table public.exams is
  'A student''s class exams and results. Managed by the student and the tutor.';
comment on column public.exams.percent is 'Score as a percentage, 0–100. Null until marked.';
comment on column public.exams.ib_grade is 'IB grade, 1–7. Null until marked.';

-- Exams are for students, and stay with the student they were made for.
create function private.guard_exam()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.student_id is distinct from old.student_id then
    raise exception 'an exam cannot move to another student';
  end if;
  if not exists (select 1 from public.profiles p where p.id = new.student_id and p.role = 'student') then
    raise exception 'exams belong to students';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_exam() from public, anon, authenticated;

create trigger exams_guard
  before insert or update on public.exams
  for each row execute function private.guard_exam();

-- ── Topics an exam covered ──────────────────────────────────────────────────

create table public.exam_topics (
  exam_id     uuid not null references public.exams (id) on delete cascade,
  topic_id    uuid not null references public.syllabus_topics (id) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (exam_id, topic_id)
);

create index exam_topics_topic_idx on public.exam_topics (topic_id);

comment on table public.exam_topics is 'Syllabus subtopics an exam covered.';

-- As with task tags: the topic must be in the student's course and level.
create function private.guard_exam_topic()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if not exists (
    select 1
      from public.exams e
      join public.profiles p on p.id = e.student_id
      join public.syllabus_topics t on t.id = new.topic_id
     where e.id = new.exam_id
       and t.course = p.course
       and (t.level = 'SL' or p.level = 'HL')
  ) then
    raise exception 'topic is not in this student''s course';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_exam_topic() from public, anon, authenticated;

create trigger exam_topics_guard
  before insert or update on public.exam_topics
  for each row execute function private.guard_exam_topic();

-- ── Row level security ──────────────────────────────────────────────────────
--
-- One rule for both tables: the tutor, or the student the exam is for. The
-- `with check` on exams also stops a student creating one for someone else.

alter table public.exams enable row level security;

create policy "exams managed by their student"
  on public.exams for all to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

create policy "exams managed by tutor"
  on public.exams for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());

alter table public.exam_topics enable row level security;

-- The subquery on exams runs under the caller's own exams policies, so it
-- only finds exams they may manage.
create policy "exam topics managed by whoever manages the exam"
  on public.exam_topics for all to authenticated
  using (exists (select 1 from public.exams e where e.id = exam_id))
  with check (exists (select 1 from public.exams e where e.id = exam_id));
