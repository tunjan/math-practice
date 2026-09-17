-- ============================================================================
-- 0004 — Function hardening
--
-- Closes the findings raised by the Supabase security linter after 0001–0003.
-- ============================================================================

-- ── Pin search_path ─────────────────────────────────────────────────────────
--
-- A function with a mutable search_path can be steered at call time into
-- resolving a name against an attacker-controlled schema. Pin all three.

alter function public.touch_updated_at()          set search_path = public, pg_temp;
alter function public.reminder_windows_valid(integer[]) set search_path = public, pg_temp;
alter function public.safe_uuid(text)             set search_path = public, pg_temp;

-- ── Narrow EXECUTE ──────────────────────────────────────────────────────────
--
-- `revoke ... from public` in 0001 was not enough: Supabase grants EXECUTE on
-- functions in the `public` schema to `anon` and `authenticated` directly, so
-- those grants survived and every function was reachable over
-- /rest/v1/rpc/<name>. Revoke explicitly, then hand back only what is needed.

-- Trigger functions. Never called directly by anyone; Postgres checks EXECUTE
-- when a trigger is created, not each time it fires, so the triggers keep
-- working.
revoke execute on function public.touch_updated_at()          from anon, authenticated;
revoke execute on function public.handle_new_user()           from anon, authenticated;
revoke execute on function public.handle_user_email_change()  from anon, authenticated;
revoke execute on function public.guard_profile_update()      from anon, authenticated;
revoke execute on function public.guard_assignment_update()   from anon, authenticated;

-- The rate limiter must never be reachable from a browser: a client that could
-- call it would be able to burn its own budget — or someone else's — at will.
-- Only the service role (used by our server routes) may touch it.
revoke execute on function public.consume_rate_limit(text, integer, integer)
  from anon, authenticated;
revoke execute on function public.prune_rate_limits() from anon, authenticated;

-- Policy helpers. RLS expressions are evaluated with the querying user's
-- privileges, so `authenticated` genuinely needs EXECUTE on these — without it
-- every policy that calls them would fail. `anon` never passes a policy, so it
-- gets nothing.
revoke execute on function public.is_tutor()                    from anon;
revoke execute on function public.current_user_role()           from anon;
revoke execute on function public.can_access_assignment(uuid)   from anon;
revoke execute on function public.safe_uuid(text)               from anon;
revoke execute on function public.reminder_windows_valid(integer[]) from anon;

grant execute on function public.is_tutor()                  to authenticated;
grant execute on function public.current_user_role()         to authenticated;
grant execute on function public.can_access_assignment(uuid) to authenticated;
grant execute on function public.safe_uuid(text)             to authenticated;

-- Each of the three returns only facts about the caller themselves — their own
-- role, or whether an assignment id they already hold is theirs — so exposing
-- them at /rest/v1/rpc tells an authenticated user nothing they cannot already
-- read through the tables.
