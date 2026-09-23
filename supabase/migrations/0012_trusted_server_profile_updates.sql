-- ============================================================================
-- 0012 — Let trusted server code rotate a calendar link
--
-- guard_profile_update() freezes a student's role, id and calendar_token. It
-- recognised the tutor through private.is_tutor(), which reads auth.uid(), so
-- it also froze those columns for the service role (no uid), silently. That
-- blocked the one legitimate writer of calendar_token: the server action that
-- rotates a leaked feed link.
--
-- The service role is only ever used by our own server code, after its own
-- authorisation check, and it already bypasses RLS entirely. The guard exists
-- to stop a signed-in user from rewriting protected columns, not to second
-- guess the server.
-- ============================================================================

create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if private.is_tutor() or coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
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

revoke all on function private.guard_profile_update() from public, anon, authenticated;
