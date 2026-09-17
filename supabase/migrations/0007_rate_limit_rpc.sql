-- ============================================================================
-- 0007 — A reachable entry point for the rate limiter
--
-- 0005 moved consume_rate_limit into `private`, which is the right home for it
-- but also makes it unreachable over HTTP: PostgREST only serves the schemas it
-- is configured to expose, so even the service role cannot call it.
--
-- Rather than exposing the whole `private` schema, publish one thin wrapper in
-- `public` and grant EXECUTE to `service_role` alone. `anon` and
-- `authenticated` get nothing, so /rest/v1/rpc/consume_rate_limit is a 404 for
-- anything coming from a browser.
-- ============================================================================

create function public.consume_rate_limit(
  p_key         text,
  p_limit       integer,
  p_window_secs integer
)
returns boolean
language sql
security definer
set search_path = private, public, pg_temp
as $$
  select private.consume_rate_limit(p_key, p_limit, p_window_secs);
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;

comment on function public.consume_rate_limit(text, integer, integer) is
  'Service-role-only entry point for the rate limiter. Returns true while the '
  'caller is within budget for the given key and window.';
