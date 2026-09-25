-- ============================================================================
-- 0017 — Drop learning plans
--
-- The Phase 8 plan (units, objectives, self-checks, study days and the
-- streak) is replaced by the syllabus tracker. Everything 0015 created goes,
-- along with its data, and the student guard stops referring to
-- `assignments.plan_unit_id`.
-- ============================================================================

-- The guard must stop naming the column before the column can go.
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
  new.difficulty := old.difficulty;
  new.title := old.title;
  new.description := old.description;
  new.category_id := old.category_id;
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

-- ── Tasks under units ───────────────────────────────────────────────────────

drop index if exists public.assignments_plan_unit_idx;
alter table public.assignments drop column if exists plan_unit_id;

-- ── Study days and the streak ───────────────────────────────────────────────

drop trigger if exists assignments_hand_in_records_study_day on public.assignments;
drop function if exists private.hand_in_records_study_day();
drop function if exists public.log_study_session();
drop function if exists private.record_study_day(uuid, text);
drop table if exists public.study_days;

-- ── Plans, units, objectives ────────────────────────────────────────────────

drop table if exists public.plan_objectives;
drop table if exists public.plan_units;
drop table if exists public.learning_plans;

drop function if exists private.guard_objective_update();
drop function if exists private.stamp_unit_mastery();
drop function if exists private.unit_student(uuid);
drop function if exists private.plan_student(uuid);

drop type if exists public.plan_mastery;
