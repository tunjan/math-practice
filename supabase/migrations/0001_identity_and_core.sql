-- ============================================================================
-- 0001 — Identity, shared config, and infrastructure
--
-- Establishes the two roles the whole app pivots on, the helpers every later
-- policy leans on, and the rate-limit counter that protects login and invite
-- redemption.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────

create type public.user_role as enum ('tutor', 'student');

-- ── profiles ────────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'student',
  full_name   text not null default '',
  email       text,
  -- IANA zone. Due dates are stored absolute (timestamptz); this is only used
  -- to decide which calendar day a deadline falls on for a given person.
  timezone    text not null default 'Europe/London',
  -- Unguessable feed key for the ICS calendar subscription. Rotatable without
  -- touching the account.
  calendar_token uuid not null default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index profiles_calendar_token_key on public.profiles (calendar_token);
create index profiles_role_idx on public.profiles (role);

comment on table public.profiles is
  'One row per auth user. Created automatically by handle_new_user().';
comment on column public.profiles.calendar_token is
  'Bearer key for the read-only ICS feed at /api/calendar/<token>.ics.';

-- ── Role helpers ────────────────────────────────────────────────────────────
--
-- SECURITY DEFINER so they bypass RLS. Without that, a policy on `profiles`
-- that called is_tutor() would recurse into `profiles` and error out.

create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_tutor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'tutor'
  );
$$;

revoke execute on function public.current_user_role() from public;
revoke execute on function public.is_tutor() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_tutor() to authenticated;

-- ── Shared triggers ─────────────────────────────────────────────────────────

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Account provisioning ────────────────────────────────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  assigned_role public.user_role;
begin
  -- This is a single-tutor platform. The very first account to exist is the
  -- tutor's; everyone after arrives through an invite and is a student. The
  -- client cannot influence this — the role is never read from user metadata.
  if exists (select 1 from public.profiles where role = 'tutor') then
    assigned_role := 'student';
  else
    assigned_role := 'tutor';
  end if;

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    assigned_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    new.email
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the denormalised email in step when the user changes it.
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ── tutor_settings ──────────────────────────────────────────────────────────

-- A check constraint may not contain a subquery, so the element-wise bounds
-- test lives in an IMMUTABLE helper the constraint calls.
create function public.reminder_windows_valid(windows integer[])
returns boolean
language sql
immutable
as $$
  select windows is not null
     and array_length(windows, 1) between 1 and 6
     and not exists (
       select 1 from unnest(windows) as h where h < 1 or h > 336
     );
$$;

create table public.tutor_settings (
  tutor_id          uuid primary key references public.profiles (id) on delete cascade,
  -- Hours before a deadline at which a reminder should go out.
  reminder_windows  integer[] not null default '{48,24,6}',
  updated_at        timestamptz not null default now(),
  constraint reminder_windows_sane
    check (public.reminder_windows_valid(reminder_windows))
);

create trigger tutor_settings_touch_updated_at
  before update on public.tutor_settings
  for each row execute function public.touch_updated_at();

-- ── categories ──────────────────────────────────────────────────────────────

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Which accent the status dot uses for this topic. Constrained to the brand
  -- palette so a category can never introduce an off-palette colour.
  accent_key  text not null default 'mute',
  created_by  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_accent_known check (
    accent_key in ('mute', 'sunset', 'sunset_soft', 'dusk', 'twilight', 'breeze')
  )
);

create unique index categories_name_key on public.categories (lower(trim(name)));

comment on table public.categories is
  'Shared topic taxonomy. Used by both assignment tagging and the library.';

-- ── rate_limits ─────────────────────────────────────────────────────────────

create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (key, window_start)
);

comment on table public.rate_limits is
  'Fixed-window counter shared by every server instance. Reached only through '
  'consume_rate_limit(); no client role has any policy on this table.';

-- Fixed-window counter. Returns true when the caller is still within budget.
-- The upsert is atomic, so two instances racing on the same key cannot both
-- read a stale count.
create function public.consume_rate_limit(
  p_key           text,
  p_limit         integer,
  p_window_secs   integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_secs) * p_window_secs
  );

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Housekeeping for the counter table; called by the scheduled reminder job.
create function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public;
revoke execute on function public.prune_rate_limits() from public;

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.tutor_settings enable row level security;
alter table public.categories     enable row level security;
alter table public.rate_limits    enable row level security;

-- profiles: a student sees only themselves. The tutor sees the roster.
create policy "profiles readable by self"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles readable by tutor"
  on public.profiles for select to authenticated
  using (public.is_tutor());

-- A student may edit their own display details but never their role. The role
-- column is protected by the guard trigger below, because RLS cannot express
-- column-level rules.
create policy "profiles updatable by self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles updatable by tutor"
  on public.profiles for update to authenticated
  using (public.is_tutor())
  with check (public.is_tutor());

create function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_tutor() then
    return new;
  end if;

  -- Freeze everything a student has no business changing.
  new.role := old.role;
  new.id := old.id;
  new.created_at := old.created_at;
  new.calendar_token := old.calendar_token;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- tutor_settings: the tutor's own row, nobody else's.
create policy "tutor settings owned by tutor"
  on public.tutor_settings for all to authenticated
  using (tutor_id = auth.uid() and public.is_tutor())
  with check (tutor_id = auth.uid() and public.is_tutor());

-- categories: everyone reads the taxonomy; only the tutor shapes it.
create policy "categories readable by all signed in"
  on public.categories for select to authenticated
  using (true);

create policy "categories writable by tutor"
  on public.categories for all to authenticated
  using (public.is_tutor())
  with check (public.is_tutor() and created_by = auth.uid());

-- rate_limits: deliberately no policies. RLS is on and nothing is granted, so
-- the table is unreachable except through the SECURITY DEFINER functions.
