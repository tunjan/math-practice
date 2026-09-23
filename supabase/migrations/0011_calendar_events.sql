-- ============================================================================
-- 0011 — Calendar events
--
-- Deadlines are not stored here: they are assignments, and the calendar reads
-- them straight from `assignments.due_at`. This table holds everything else a
-- person puts on their own calendar: lessons, exams, study sessions.
--
-- Every event has one owner and may be shared with one other person, always
-- across the tutor/student line:
--
--   * The tutor can share an event with one student (a lesson with them).
--   * A student can share an event with the tutor (a school exam coming up).
--
-- Only the owner can change or delete an event. The person it is shared with
-- sees it, read-only. Nobody else sees it, the tutor included: a student's
-- private study plan is theirs.
--
-- All-day events are floating dates rather than moments: an exam on the 25th
-- is on the 25th in every timezone. They are stored as UTC midnights, end
-- exclusive (so a one-day event runs from D 00:00Z to D+1 00:00Z), which is
-- the same shape iCalendar uses for DTSTART;VALUE=DATE.
-- ============================================================================

create type public.calendar_event_kind as enum ('lesson', 'exam', 'study', 'other');

create table public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  shared_with  uuid references public.profiles (id) on delete set null,
  kind         public.calendar_event_kind not null default 'other',
  title        text not null,
  notes        text,
  all_day      boolean not null default false,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint calendar_events_title_length
    check (length(trim(title)) between 1 and 200),
  constraint calendar_events_notes_length
    check (notes is null or length(notes) <= 2000),
  constraint calendar_events_ordered
    check (ends_at > starts_at),
  -- Long enough for a holiday or an exam season; short enough that one row
  -- can never paint every cell of every month.
  constraint calendar_events_span
    check (ends_at - starts_at <= interval '31 days'),
  constraint calendar_events_all_day_is_dates check (
    not all_day
    or (
      (starts_at at time zone 'UTC')::time = time '00:00'
      and (ends_at at time zone 'UTC')::time = time '00:00'
    )
  ),
  constraint calendar_events_not_shared_with_self
    check (shared_with is null or shared_with <> owner_id)
);

-- A month view asks "what overlaps this range?" for the owner and for the
-- person it is shared with. Both indexes lead with the person, then time.
create index calendar_events_owner_idx
  on public.calendar_events (owner_id, starts_at);
create index calendar_events_shared_idx
  on public.calendar_events (shared_with, starts_at)
  where shared_with is not null;

create trigger calendar_events_touch_updated_at
  before update on public.calendar_events
  for each row execute function private.touch_updated_at();

comment on table public.calendar_events is
  'Personal calendar entries. Owned by one person, optionally shared with one '
  'person on the other side of the tutor/student line.';
comment on column public.calendar_events.shared_with is
  'Who else sees the event, read-only. Must hold the other role from the owner.';
comment on column public.calendar_events.all_day is
  'When true, starts_at/ends_at are UTC midnights and ends_at is exclusive.';

-- ── Sharing rule ────────────────────────────────────────────────────────────
--
-- Sharing only makes sense across roles: a tutor with a student, a student
-- with the tutor. Students cannot read each other's profiles, so without this
-- a student could still share with a classmate by guessing their id.

create function private.can_share_event_with(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select p_target is null
      or exists (
        select 1
        from public.profiles me
        join public.profiles them on them.id = p_target
        where me.id = auth.uid()
          and them.role <> me.role
      );
$$;

revoke all on function private.can_share_event_with(uuid) from public, anon, authenticated;
grant execute on function private.can_share_event_with(uuid) to authenticated;

-- ── Row level security ──────────────────────────────────────────────────────
--
-- `(select auth.uid())` rather than `auth.uid()`: the subquery is evaluated
-- once per statement instead of once per row.

alter table public.calendar_events enable row level security;

create policy "calendar events readable by owner and recipient"
  on public.calendar_events for select to authenticated
  using (
    owner_id = (select auth.uid())
    or shared_with = (select auth.uid())
  );

create policy "calendar events created by their owner"
  on public.calendar_events for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.can_share_event_with(shared_with)
  );

create policy "calendar events updatable by their owner"
  on public.calendar_events for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and private.can_share_event_with(shared_with)
  );

create policy "calendar events deletable by their owner"
  on public.calendar_events for delete to authenticated
  using (owner_id = (select auth.uid()));
