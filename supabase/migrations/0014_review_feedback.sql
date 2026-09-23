-- ============================================================================
-- 0014 — Written feedback with a verdict
--
-- A verdict alone tells the student *that* something needs changing, not what.
-- The tutor can now write a note with it. The note belongs to the verdict:
--
--   * It can only exist while a verdict does (withdrawing the verdict clears it).
--   * It is the tutor's alone; the guard keeps students from writing it.
--   * A resubmission sets it aside with the verdict (0010), and an unsubmit
--     puts it back, so feedback and verdict always travel together.
-- ============================================================================

alter table public.assignments
  add column feedback            text,
  add column superseded_feedback text,
  add constraint assignments_feedback_needs_verdict
    check (feedback is null or verdict is not null),
  add constraint assignments_feedback_length
    check (feedback is null or length(feedback) <= 5000);

comment on column public.assignments.feedback is
  'The tutor''s written note on the current verdict. Markdown with maths.';
comment on column public.assignments.superseded_feedback is
  'The feedback a resubmission cleared, kept so an unsubmit can restore it.';

-- ── Guard: students cannot write feedback ───────────────────────────────────

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

-- ── Hand-in and unsubmit carry the feedback with the verdict ─────────────────

create or replace function private.resubmission_reopens_review()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  latest_revision integer;
begin
  -- Handing in: the first time, again after an unsubmit, or a new revision.
  if new.submitted_at is not null
     and new.submitted_at is distinct from old.submitted_at
  then
    -- The thing that was judged has changed, so the verdict no longer stands.
    -- Keep it aside in case this hand-in is taken back.
    if old.reviewed_at is not null then
      new.superseded_submitted_at := old.submitted_at;
      new.superseded_reviewed_at := old.reviewed_at;
      new.superseded_verdict := old.verdict;
      new.superseded_feedback := old.feedback;
      new.verdict := null;
      new.reviewed_at := null;
      new.feedback := null;
    end if;

    update public.submissions
       set handed_in_at = new.submitted_at
     where assignment_id = new.id
       and handed_in_at is null;
  end if;

  -- Unsubmitting. The guard has already refused this for reviewed work.
  if old.submitted_at is not null and new.submitted_at is null then
    select max(revision) into latest_revision
      from public.submissions
     where assignment_id = new.id
       and handed_in_at is not null;

    update public.submissions
       set handed_in_at = null
     where assignment_id = new.id
       and revision = latest_revision;

    -- If this hand-in had superseded a review, that review stands again.
    if old.superseded_reviewed_at is not null then
      new.submitted_at := old.superseded_submitted_at;
      new.reviewed_at := old.superseded_reviewed_at;
      new.verdict := old.superseded_verdict;
      new.feedback := old.superseded_feedback;
    end if;

    new.superseded_submitted_at := null;
    new.superseded_reviewed_at := null;
    new.superseded_verdict := null;
    new.superseded_feedback := null;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_assignment_update()     from public, anon, authenticated;
revoke all on function private.resubmission_reopens_review() from public, anon, authenticated;
