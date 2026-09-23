-- ============================================================================
-- 0010 — Students can unsubmit work that is still waiting for review
--
-- Handed-in files were plain rows with no notion of "not handed in yet", so the
-- only way to change a hand-in was to delete files one by one. Now:
--
--   * A submission row is a DRAFT until it is handed in (`handed_in_at` null).
--     Handing in stamps every draft row; unsubmitting turns the latest
--     handed-in revision back into drafts, files and all.
--   * Handed-in rows are read-only to the student. Only drafts can be removed,
--     in the table and in storage, which also closes a hole where a
--     resubmission (which clears the verdict) made earlier, already-reviewed
--     revisions deletable again.
--   * A resubmission still clears the verdict (0009), but now keeps it aside.
--     Unsubmitting that resubmission puts the tutor's feedback back, so the
--     task returns to "changes requested" rather than to "in progress".
--
-- All of this happens in triggers, as a consequence of `submitted_at`
-- changing, for the same reason 0009 does: the student may not write
-- `verdict`, and whichever route changes `submitted_at`, the rows must follow.
-- ============================================================================

-- ── submissions: drafts vs handed in ─────────────────────────────────────────

alter table public.submissions add column handed_in_at timestamptz;

-- Everything that exists today was handed in.
update public.submissions set handed_in_at = created_at;

create index submissions_drafts_idx
  on public.submissions (assignment_id)
  where handed_in_at is null;

comment on column public.submissions.handed_in_at is
  'Null while the file is a draft. Set when its revision is handed in; cleared '
  'again if the student unsubmits before review.';

-- ── assignments: the review a resubmission superseded ────────────────────────

alter table public.assignments
  add column superseded_submitted_at timestamptz,
  add column superseded_reviewed_at  timestamptz,
  add column superseded_verdict      public.review_verdict;

comment on column public.assignments.superseded_verdict is
  'The verdict a resubmission cleared, kept so an unsubmit can restore it.';

-- ── Guard: students cannot touch the stash, or take back reviewed work ──────

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

  -- The verdict is the tutor's alone.
  new.reviewed_at := old.reviewed_at;
  new.verdict := old.verdict;

  -- Bookkeeping for assignments_resubmission_reopens_review, which runs after
  -- this trigger and is the only thing allowed to write it.
  new.superseded_submitted_at := old.superseded_submitted_at;
  new.superseded_reviewed_at := old.superseded_reviewed_at;
  new.superseded_verdict := old.superseded_verdict;

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

-- ── Hand-in and unsubmit, as consequences of submitted_at ────────────────────
--
-- Replaces 0009's body; CREATE OR REPLACE keeps the OID, so the trigger stays
-- attached and still sorts after the guard. SECURITY DEFINER because students
-- have no UPDATE policy on submissions: they cannot flip handed_in_at
-- themselves, only by handing in or unsubmitting.

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
      new.verdict := null;
      new.reviewed_at := null;
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
    end if;

    new.superseded_submitted_at := null;
    new.superseded_reviewed_at := null;
    new.superseded_verdict := null;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_assignment_update()     from public, anon, authenticated;
revoke all on function private.resubmission_reopens_review() from public, anon, authenticated;

-- ── Row level security: only drafts are the student's to change ─────────────

drop policy "submissions created by their student" on public.submissions;
create policy "submissions created by their student as drafts"
  on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid()
    and handed_in_at is null
    and private.can_access_assignment(assignment_id)
  );

drop policy "submissions removable by their student before review" on public.submissions;
create policy "draft submissions removable by their student"
  on public.submissions for delete to authenticated
  using (student_id = auth.uid() and handed_in_at is null);

-- Storage follows the table: a student may delete their own objects unless the
-- object is part of work that has been handed in. Uploads that never became a
-- row (staged, then abandoned) stay removable.
drop policy "submitted work removable by its student" on storage.objects;
create policy "submitted work removable by its student until handed in"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'submissions'
    and private.safe_uuid((storage.foldername(name))[2]) = auth.uid()
    and not exists (
      select 1
      from public.submissions s
      where s.storage_path = objects.name
        and s.handed_in_at is not null
    )
  );
