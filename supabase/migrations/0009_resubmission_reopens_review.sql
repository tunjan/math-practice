-- ============================================================================
-- 0009 — A new submission reopens the review
--
-- When a student re-submits after "changes requested", the thing that was
-- judged has changed, so the old verdict should no longer stand.
--
-- This cannot live in the client: guard_assignment_update() deliberately stops
-- a student writing `verdict` or `reviewed_at`, and rightly so. It belongs in
-- the database, as a consequence of the submission rather than something the
-- submitter asks for.
--
-- Trigger order matters. Postgres fires BEFORE triggers in name order, so
-- `assignments_guard_update` runs first and restores the old verdict; this one
-- sorts after it and clears it again.
-- ============================================================================

create function private.resubmission_reopens_review()
returns trigger
language plpgsql
set search_path = private, public, pg_temp
as $$
begin
  if new.submitted_at is distinct from old.submitted_at
     and new.submitted_at is not null
     and old.reviewed_at is not null
  then
    new.verdict := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

revoke all on function private.resubmission_reopens_review()
  from public, anon, authenticated;

create trigger assignments_resubmission_reopens_review
  before update on public.assignments
  for each row execute function private.resubmission_reopens_review();
