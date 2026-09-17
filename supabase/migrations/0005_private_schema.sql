-- ============================================================================
-- 0005 — Move internal functions out of the exposed API schema
--
-- Everything in `public` is published by PostgREST at /rest/v1/rpc/<name>.
-- Revoking EXECUTE piecemeal works but leaves the functions one stray default
-- grant away from being reachable again. Moving them into `private`, which
-- PostgREST does not expose, removes the surface rather than guarding it.
--
-- Dependent policies, triggers and check constraints reference functions by
-- OID, so they follow the move without being rewritten.
-- ============================================================================

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter function public.is_tutor()                          set schema private;
alter function public.current_user_role()                 set schema private;
alter function public.can_access_assignment(uuid)         set schema private;
alter function public.safe_uuid(text)                     set schema private;
alter function public.reminder_windows_valid(integer[])   set schema private;
alter function public.touch_updated_at()                  set schema private;
alter function public.handle_new_user()                   set schema private;
alter function public.handle_user_email_change()          set schema private;
alter function public.guard_profile_update()              set schema private;
alter function public.guard_assignment_update()           set schema private;
alter function public.consume_rate_limit(text, integer, integer) set schema private;
alter function public.prune_rate_limits()                 set schema private;

-- Re-pin search_path to include the new home, so an unqualified name inside
-- these functions still resolves the way it did before the move.
alter function private.is_tutor()                        set search_path = private, public, pg_temp;
alter function private.current_user_role()               set search_path = private, public, pg_temp;
alter function private.can_access_assignment(uuid)       set search_path = private, public, pg_temp;
alter function private.safe_uuid(text)                   set search_path = private, public, pg_temp;
alter function private.reminder_windows_valid(integer[]) set search_path = private, public, pg_temp;
alter function private.touch_updated_at()                set search_path = private, public, pg_temp;
alter function private.handle_new_user()                 set search_path = private, public, pg_temp;
alter function private.handle_user_email_change()        set search_path = private, public, pg_temp;
alter function private.guard_profile_update()            set search_path = private, public, pg_temp;
alter function private.guard_assignment_update()         set search_path = private, public, pg_temp;
alter function private.consume_rate_limit(text, integer, integer)
  set search_path = private, public, pg_temp;
alter function private.prune_rate_limits()               set search_path = private, public, pg_temp;

-- Nothing in here is callable by default.
revoke all on all functions in schema private from public, anon, authenticated;

-- RLS policy expressions are evaluated with the querying user's privileges, so
-- `authenticated` must be able to execute the three helpers the policies call —
-- otherwise every policy that references them fails outright. They are no longer
-- reachable over HTTP, only from inside a policy.
grant execute on function private.is_tutor()                  to authenticated;
grant execute on function private.can_access_assignment(uuid) to authenticated;
grant execute on function private.safe_uuid(text)             to authenticated;

-- Used by a CHECK constraint on tutor_settings, which is evaluated as the
-- writing user.
grant execute on function private.reminder_windows_valid(integer[]) to authenticated;

-- The rate limiter belongs to our server routes alone.
grant execute on function private.consume_rate_limit(text, integer, integer)
  to service_role;
grant execute on function private.prune_rate_limits() to service_role;
