-- ============================================================================
-- 0026 — GCSE programme, course and level support
--
-- Extends the syllabus enums so the tracker can support Cambridge IGCSE
-- Mathematics (0580) alongside IB Diploma (AA and AI).
--
-- Like IB Diploma (SL / HL with SL / AHL content), IGCSE is split into
-- Core and Extended tiers, where Core content is studied by all and Extended
-- adds higher-tier material.
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────

alter type public.ib_programme add value if not exists 'gcse';
alter type public.ib_course add value if not exists '0580';
alter type public.ib_level add value if not exists 'Core';
alter type public.ib_level add value if not exists 'Extended';
alter type public.syllabus_level add value if not exists 'Core';
alter type public.syllabus_level add value if not exists 'Extended';

-- ── Topic and grade bounds ──────────────────────────────────────────────────

-- 0580 has 9 syllabus topics (Number through Statistics), whereas IB has 5.
alter table public.syllabus_topics drop constraint if exists syllabus_topics_topic;
alter table public.syllabus_topics add constraint syllabus_topics_topic check (topic between 1 and 9);

-- GCSE exams use 9–1 grading.
alter table public.exams drop constraint if exists exams_ib_grade_range;
alter table public.exams add constraint exams_ib_grade_range check (ib_grade is null or ib_grade between 1 and 9);

-- ── Update guards to recognize both IB and GCSE level tiers ──────────────────

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
         (p.level = 'Extended' and t.level in ('Core', 'Extended'))
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
         (p.level = 'Extended' and t.level in ('Core', 'Extended'))
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
         (p.level = 'Extended' and t.level in ('Core', 'Extended'))
       )
  ) then
    raise exception 'topic is not in this student''s course';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_exam_topic() from public, anon, authenticated;
