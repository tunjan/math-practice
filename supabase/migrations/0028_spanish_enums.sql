-- ============================================================================
-- 0028 — Spanish ESO and Bachillerato programme, course and level support
--
-- Extends the syllabus enums to support the Spanish secondary and high-school
-- curriculum (LOMLOE):
-- - ESO: 3º ESO and 4º ESO (Ciencias / Sociales tracks)
-- - Bachillerato: 1º and 2º Bachillerato (Ciencias / Sociales tracks)
--
-- Widens exams grading from 1–9 to 1–10 to support standard Spanish scoring (1–10).
-- Replaces syllabus_topics unique constraint to (course, level, code) so tracks
-- under the same course can share subtopic code numbering.
-- Updates guard functions to validate Spanish tier assignments (p.level = t.level).
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────

alter type public.ib_programme add value if not exists 'eso';
alter type public.ib_programme add value if not exists 'bachillerato';

alter type public.ib_course add value if not exists '3eso';
alter type public.ib_course add value if not exists '4eso';
alter type public.ib_course add value if not exists '1bach';
alter type public.ib_course add value if not exists '2bach';

alter type public.ib_level add value if not exists 'Ciencias';
alter type public.ib_level add value if not exists 'Sociales';
alter type public.ib_level add value if not exists 'Común';

alter type public.syllabus_level add value if not exists 'Ciencias';
alter type public.syllabus_level add value if not exists 'Sociales';
alter type public.syllabus_level add value if not exists 'Común';

-- ── Unique constraint on syllabus_topics ────────────────────────────────────

alter table public.syllabus_topics drop constraint if exists syllabus_topics_course_code;
alter table public.syllabus_topics drop constraint if exists syllabus_topics_course_level_code;
alter table public.syllabus_topics add constraint syllabus_topics_course_level_code unique (course, level, code);

-- ── Spanish 1–10 exam grades ────────────────────────────────────────────────

alter table public.exams drop constraint if exists exams_ib_grade_range;
alter table public.exams add constraint exams_ib_grade_range check (ib_grade is null or ib_grade between 1 and 10);

-- ── Update guards to validate IB, GCSE and Spanish curriculum tiers ─────────

create or replace function private.guard_assignment_topic()
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
       and (
         (p.level = 'SL' and t.level = 'SL') or
         (p.level = 'HL' and t.level in ('SL', 'AHL')) or
         (p.level = 'Core' and t.level = 'Core') or
         (p.level = 'Extended' and t.level in ('Core', 'Extended')) or
         (p.level = t.level)
       )
  ) then
    raise exception 'topic is not in this student''s course';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_assignment_topic() from public, anon, authenticated;

create or replace function private.guard_topic_progress()
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
       and (
         (p.level = 'SL' and t.level = 'SL') or
         (p.level = 'HL' and t.level in ('SL', 'AHL')) or
         (p.level = 'Core' and t.level = 'Core') or
         (p.level = 'Extended' and t.level in ('Core', 'Extended')) or
         (p.level = t.level)
       )
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

create or replace function private.guard_exam_topic()
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
       and (
         (p.level = 'SL' and t.level = 'SL') or
         (p.level = 'HL' and t.level in ('SL', 'AHL')) or
         (p.level = 'Core' and t.level = 'Core') or
         (p.level = 'Extended' and t.level in ('Core', 'Extended')) or
         (p.level = t.level)
       )
  ) then
    raise exception 'topic is not in this student''s course';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_exam_topic() from public, anon, authenticated;
