-- ============================================================================
-- 0019 — Syllabus topics on tasks
--
-- A task can be tagged with any number of its student's syllabus subtopics.
-- The tags are the tutor's; the student reads them. A tag must come from the
-- student's own course and level at the time it is added. Changing the
-- student's course later leaves existing tags alone.
--
-- Tasks waiting on an invite (pending_assignments) have no student course
-- yet, so they carry no topics.
-- ============================================================================

create table public.assignment_topics (
  assignment_id  uuid not null references public.assignments (id) on delete cascade,
  topic_id       uuid not null references public.syllabus_topics (id) on delete restrict,
  created_at     timestamptz not null default now(),
  primary key (assignment_id, topic_id)
);

create index assignment_topics_topic_idx on public.assignment_topics (topic_id);

comment on table public.assignment_topics is
  'Syllabus subtopics a task covers. Written by the tutor, read by the student.';

-- The topic must belong to the student's course, and be SL unless they're HL.
create function private.guard_assignment_topic()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if not exists (
    select 1
      from public.assignments a
      join public.profiles p on p.id = a.student_id
      join public.syllabus_topics t on t.id = new.topic_id
     where a.id = new.assignment_id
       and t.course = p.course
       and (t.level = 'SL' or p.level = 'HL')
  ) then
    raise exception 'topic is not in this student''s course';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_assignment_topic() from public, anon, authenticated;

create trigger assignment_topics_guard
  before insert or update on public.assignment_topics
  for each row execute function private.guard_assignment_topic();

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.assignment_topics enable row level security;

create policy "assignment topics readable by participants"
  on public.assignment_topics for select to authenticated
  using (private.can_access_assignment(assignment_id));

create policy "assignment topics managed by tutor"
  on public.assignment_topics for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());
