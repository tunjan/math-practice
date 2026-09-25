-- ============================================================================
-- 0016 — Difficulty, points and the aviary
--
-- The tutor rates each task easy, medium, hard or ultra. When the tutor
-- approves it, the student earns points for that difficulty, once. Points buy
-- birds for the student's aviary and accessories to dress them in.
--
--   * Points are a ledger, never a stored balance: what was earned
--     (`point_awards`) minus what was spent (`aviary_unlocks`).
--   * Awards are written only by a trigger on the tutor's verdict, one per task,
--     so withdrawing and re-giving an approval, or a resubmission, can never pay
--     twice. Withdrawing an approval does not claw points back: a student may
--     already have spent them.
--   * Prices live in `aviary_items`, so the purchase function can trust them.
--     The art (sprites, names, where a hat sits) lives in the app, keyed by id.
--   * Students write nothing directly. Every purchase and outfit change goes
--     through a security-definer function that checks ownership and balance.
-- ============================================================================

create type public.task_difficulty as enum ('easy', 'medium', 'hard', 'ultra');

alter table public.assignments
  add column difficulty public.task_difficulty not null default 'medium';

alter table public.pending_assignments
  add column difficulty public.task_difficulty not null default 'medium';

comment on column public.assignments.difficulty is
  'Set by the tutor. Decides the points an approval is worth.';

-- Mirrored in src/lib/aviary/difficulty.ts for display.
create function private.difficulty_points(p_difficulty public.task_difficulty)
returns integer
language sql
immutable
set search_path = private, public, pg_temp
as $$
  select case p_difficulty
    when 'easy'   then 10
    when 'medium' then 20
    when 'hard'   then 40
    when 'ultra'  then 75
  end;
$$;

revoke all on function private.difficulty_points(public.task_difficulty) from public, anon, authenticated;

-- ── Catalogue ───────────────────────────────────────────────────────────────

create table public.aviary_items (
  id        text primary key,
  kind      text not null,
  -- Where an accessory is worn; birds have none. One accessory per slot.
  slot      text,
  cost      integer not null,
  position  integer not null,

  constraint aviary_items_kind check (kind in ('bird', 'accessory')),
  constraint aviary_items_slot check (
    (kind = 'bird' and slot is null)
    or (kind = 'accessory' and slot in ('head', 'eyes', 'neck', 'feet', 'crest'))
  ),
  constraint aviary_items_cost check (cost >= 0)
);

comment on table public.aviary_items is
  'What the aviary sells. A bird that costs nothing is every student''s from the start.';

insert into public.aviary_items (id, kind, slot, cost, position) values
  ('sparrow',          'bird',      null,    0,   1),
  ('bluebird',         'bird',      null,    60,  2),
  ('wren',             'bird',      null,    120, 3),
  ('owlet',            'bird',      null,    250, 4),

  ('bell-collar',      'accessory', 'neck',  25,  10),
  ('green-feather',    'accessory', 'crest', 25,  11),
  ('brown-feather',    'accessory', 'crest', 25,  12),
  ('bead-necklace',    'accessory', 'neck',  30,  13),
  ('bow-tie',          'accessory', 'neck',  30,  14),
  ('straw-hat',        'accessory', 'head',  35,  15),
  ('boots',            'accessory', 'feet',  35,  16),
  ('flower-crown',     'accessory', 'head',  40,  17),
  ('locket',           'accessory', 'neck',  40,  18),
  ('goggles',          'accessory', 'eyes',  45,  19),
  ('compass',          'accessory', 'neck',  45,  20),
  ('top-hat',          'accessory', 'head',  50,  21),
  ('sapphire-pendant', 'accessory', 'neck',  55,  22),
  ('emerald-pendant',  'accessory', 'neck',  55,  23),
  ('pirate-hat',       'accessory', 'head',  60,  24),
  ('crown',            'accessory', 'head',  80,  25);

-- ── Ledger ──────────────────────────────────────────────────────────────────

create table public.point_awards (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles (id) on delete cascade,
  -- Kept (as null) if the task is deleted: points already earned stay earned.
  assignment_id  uuid unique references public.assignments (id) on delete set null,
  title          text not null,
  difficulty     public.task_difficulty not null,
  points         integer not null,
  awarded_at     timestamptz not null default now(),

  constraint point_awards_points check (points > 0)
);

create index point_awards_student_idx on public.point_awards (student_id, awarded_at desc);

comment on table public.point_awards is
  'Points earned, one row per approved task. Written only by a trigger.';

create table public.aviary_unlocks (
  student_id   uuid not null references public.profiles (id) on delete cascade,
  item_id      text not null references public.aviary_items (id),
  -- The price paid, so a later price change cannot rewrite the balance.
  cost         integer not null,
  unlocked_at  timestamptz not null default now(),
  primary key (student_id, item_id),

  constraint aviary_unlocks_cost check (cost >= 0)
);

-- Which bird the student shows, and what each of their birds is wearing.
create table public.aviary_companions (
  student_id  uuid primary key references public.profiles (id) on delete cascade,
  bird_id     text not null references public.aviary_items (id),
  updated_at  timestamptz not null default now()
);

create table public.aviary_outfits (
  student_id  uuid not null references public.profiles (id) on delete cascade,
  bird_id     text not null references public.aviary_items (id),
  slot        text not null,
  item_id     text not null references public.aviary_items (id),
  primary key (student_id, bird_id, slot)
);

-- ── Earning ─────────────────────────────────────────────────────────────────

create function private.approval_awards_points()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if new.verdict = 'approved' and old.verdict is distinct from 'approved' then
    insert into public.point_awards (student_id, assignment_id, title, difficulty, points)
    values (
      new.student_id, new.id, new.title, new.difficulty,
      private.difficulty_points(new.difficulty)
    )
    on conflict (assignment_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.approval_awards_points() from public, anon, authenticated;

create trigger assignments_approval_awards_points
  after update of verdict on public.assignments
  for each row execute function private.approval_awards_points();

-- Work approved before points existed counts, at the default difficulty.
insert into public.point_awards (student_id, assignment_id, title, difficulty, points, awarded_at)
select a.student_id, a.id, a.title, a.difficulty,
       private.difficulty_points(a.difficulty), coalesce(a.reviewed_at, now())
  from public.assignments a
 where a.verdict = 'approved'
on conflict (assignment_id) do nothing;

-- ── Spending ────────────────────────────────────────────────────────────────

create function private.points_balance(p_student uuid)
returns integer
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select coalesce((select sum(points) from public.point_awards where student_id = p_student), 0)::integer
       - coalesce((select sum(cost) from public.aviary_unlocks where student_id = p_student), 0)::integer;
$$;

create function private.owns_item(p_student uuid, p_item text)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select exists (select 1 from public.aviary_items where id = p_item and cost = 0)
      or exists (select 1 from public.aviary_unlocks where student_id = p_student and item_id = p_item);
$$;

revoke all on function private.points_balance(uuid) from public, anon, authenticated;
revoke all on function private.owns_item(uuid, text) from public, anon, authenticated;

-- The calling student, locked so two purchases in flight cannot both spend
-- the same points.
create function private.aviary_student()
returns uuid
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  perform 1 from public.profiles
   where id = auth.uid() and role = 'student'
     for update;
  if not found then
    raise exception 'not permitted';
  end if;
  return auth.uid();
end;
$$;

revoke all on function private.aviary_student() from public, anon, authenticated;

-- Returns the balance left. Errors are stable words the app maps to copy.
create function public.aviary_unlock(p_item text)
returns integer
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_student uuid := private.aviary_student();
  v_item public.aviary_items%rowtype;
  v_balance integer;
begin
  select * into v_item from public.aviary_items where id = p_item;
  if not found then
    raise exception 'unknown_item';
  end if;
  if private.owns_item(v_student, p_item) then
    raise exception 'already_owned';
  end if;

  v_balance := private.points_balance(v_student);
  if v_balance < v_item.cost then
    raise exception 'not_enough_points';
  end if;

  insert into public.aviary_unlocks (student_id, item_id, cost)
  values (v_student, p_item, v_item.cost);

  -- A new bird flies straight in as the companion.
  if v_item.kind = 'bird' then
    insert into public.aviary_companions (student_id, bird_id)
    values (v_student, p_item)
    on conflict (student_id) do update set bird_id = excluded.bird_id, updated_at = now();
  end if;

  return v_balance - v_item.cost;
end;
$$;

create function public.aviary_choose_bird(p_bird text)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_student uuid := private.aviary_student();
begin
  if not exists (select 1 from public.aviary_items where id = p_bird and kind = 'bird')
     or not private.owns_item(v_student, p_bird)
  then
    raise exception 'not_owned';
  end if;

  insert into public.aviary_companions (student_id, bird_id)
  values (v_student, p_bird)
  on conflict (student_id) do update set bird_id = excluded.bird_id, updated_at = now();
end;
$$;

-- Puts an accessory on a bird, replacing whatever was in that slot.
create function public.aviary_equip(p_bird text, p_item text)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_student uuid := private.aviary_student();
  v_slot text;
begin
  select slot into v_slot from public.aviary_items where id = p_item and kind = 'accessory';
  if v_slot is null
     or not exists (select 1 from public.aviary_items where id = p_bird and kind = 'bird')
     or not private.owns_item(v_student, p_bird)
     or not private.owns_item(v_student, p_item)
  then
    raise exception 'not_owned';
  end if;

  insert into public.aviary_outfits (student_id, bird_id, slot, item_id)
  values (v_student, p_bird, v_slot, p_item)
  on conflict (student_id, bird_id, slot) do update set item_id = excluded.item_id;
end;
$$;

create function public.aviary_unequip(p_bird text, p_item text)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_student uuid := private.aviary_student();
begin
  delete from public.aviary_outfits
   where student_id = v_student and bird_id = p_bird and item_id = p_item;
end;
$$;

revoke all on function public.aviary_unlock(text) from public, anon;
revoke all on function public.aviary_choose_bird(text) from public, anon;
revoke all on function public.aviary_equip(text, text) from public, anon;
revoke all on function public.aviary_unequip(text, text) from public, anon;
grant execute on function public.aviary_unlock(text) to authenticated;
grant execute on function public.aviary_choose_bird(text) to authenticated;
grant execute on function public.aviary_equip(text, text) to authenticated;
grant execute on function public.aviary_unequip(text, text) to authenticated;

-- ── Difficulty travels with invites and is the tutor's alone ────────────────

create or replace function private.redeem_invite(
  p_token_hash text,
  p_user_id    uuid
)
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_invite public.student_invites%rowtype;
  v_adopted integer := 0;
begin
  -- FOR UPDATE is what makes the token single-use: two requests racing on the
  -- same link serialise here, and the second finds accepted_at already set.
  select * into v_invite
  from public.student_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_invite.revoked_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'revoked');
  end if;
  if v_invite.accepted_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
  end if;
  if v_invite.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  update public.student_invites
  set accepted_at = now(), accepted_user_id = p_user_id
  where id = v_invite.id;

  -- The tutor named them when inviting; carry it over unless the student
  -- already set something themselves.
  update public.profiles
  set full_name = v_invite.full_name
  where id = p_user_id
    and full_name = ''
    and length(trim(v_invite.full_name)) > 0;

  -- Adopt queued work, keeping each id so attachments stay put.
  insert into public.assignments
    (id, tutor_id, student_id, type, difficulty, title, description, category_id, due_at, created_at)
  select
    pa.id, pa.tutor_id, p_user_id, pa.type, pa.difficulty, pa.title, pa.description,
    pa.category_id, pa.due_at, pa.created_at
  from public.pending_assignments pa
  where pa.invite_id = v_invite.id;

  get diagnostics v_adopted = row_count;

  insert into public.assignment_files
    (id, assignment_id, storage_path, file_name, mime_type, size_bytes, sort_order, created_at)
  select
    paf.id, paf.pending_assignment_id, paf.storage_path, paf.file_name,
    paf.mime_type, paf.size_bytes, paf.sort_order, paf.created_at
  from public.pending_assignment_files paf
  join public.pending_assignments pa on pa.id = paf.pending_assignment_id
  where pa.invite_id = v_invite.id;

  -- Cascades to pending_assignment_files.
  delete from public.pending_assignments where invite_id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'invite_id', v_invite.id,
    'full_name', v_invite.full_name,
    'adopted', v_adopted
  );
end;
$$;

revoke all on function private.redeem_invite(text, uuid) from public, anon, authenticated;

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
  new.difficulty := old.difficulty;
  new.title := old.title;
  new.description := old.description;
  new.category_id := old.category_id;
  new.plan_unit_id := old.plan_unit_id;
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

revoke all on function private.guard_assignment_update() from public, anon, authenticated;

-- ── Row level security ──────────────────────────────────────────────────────
--
-- Read-only from the client. Writes happen in the functions above.

alter table public.aviary_items      enable row level security;
alter table public.point_awards      enable row level security;
alter table public.aviary_unlocks    enable row level security;
alter table public.aviary_companions enable row level security;
alter table public.aviary_outfits    enable row level security;

create policy "aviary catalogue readable"
  on public.aviary_items for select to authenticated
  using (true);

create policy "point awards readable by their student"
  on public.point_awards for select to authenticated
  using (student_id = (select auth.uid()));

create policy "point awards readable by tutor"
  on public.point_awards for select to authenticated
  using (private.is_tutor());

create policy "unlocks readable by their student"
  on public.aviary_unlocks for select to authenticated
  using (student_id = (select auth.uid()));

create policy "unlocks readable by tutor"
  on public.aviary_unlocks for select to authenticated
  using (private.is_tutor());

create policy "companion readable by their student"
  on public.aviary_companions for select to authenticated
  using (student_id = (select auth.uid()));

create policy "companion readable by tutor"
  on public.aviary_companions for select to authenticated
  using (private.is_tutor());

create policy "outfits readable by their student"
  on public.aviary_outfits for select to authenticated
  using (student_id = (select auth.uid()));

create policy "outfits readable by tutor"
  on public.aviary_outfits for select to authenticated
  using (private.is_tutor());
