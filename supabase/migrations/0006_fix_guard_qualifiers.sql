-- ============================================================================
-- 0006 — Repoint the guard triggers at private.is_tutor()
--
-- ALTER FUNCTION ... SET SCHEMA moves a function and fixes up everything that
-- references it by OID (policies, triggers, constraints), but function BODIES
-- are stored as text and are not rewritten. Both guard triggers called
-- `public.is_tutor()` by name, so after 0005 every student update failed with
-- "function public.is_tutor() does not exist".
--
-- CREATE OR REPLACE keeps the existing OID, so the triggers attached in 0001
-- and 0002 continue to point at these.
-- ============================================================================

create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if private.is_tutor() then
    return new;
  end if;

  -- Freeze everything a student has no business changing. Note this runs even
  -- when the row-level policy allowed the update: RLS decides *whether* the row
  -- may be written, this decides *which columns*.
  new.role := old.role;
  new.id := old.id;
  new.created_at := old.created_at;
  new.calendar_token := old.calendar_token;
  return new;
end;
$$;

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

  -- An open receipt is written once and never rewritten, so a student cannot
  -- backdate it to look like they opened the task earlier than they did.
  if old.student_opened_at is not null then
    new.student_opened_at := old.student_opened_at;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_profile_update()    from public, anon, authenticated;
revoke all on function private.guard_assignment_update() from public, anon, authenticated;
