-- ============================================================================
-- 0008 — Student invitations and work queued against them
--
-- A tutor invites by name. The link carries a single-use bearer token; the
-- student chooses their own email and password when they redeem it.
--
-- Only the SHA-256 of the token is stored. A leaked database backup then does
-- not hand over working invite links, which a plaintext column would.
--
-- Work can be assigned to a student who has not signed up yet. The trick that
-- keeps that simple: a pending assignment is created with the id the real
-- assignment will eventually have, so uploaded materials already sit at their
-- final storage path and adoption never has to move an object.
-- ============================================================================

create table public.student_invites (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null,
  full_name   text not null default '',
  created_by  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_user_id uuid references public.profiles (id) on delete set null,
  revoked_at  timestamptz,
  constraint student_invites_accept_paired check (
    (accepted_at is null) = (accepted_user_id is null)
  )
);

create unique index student_invites_token_hash_key
  on public.student_invites (token_hash);
create index student_invites_open_idx
  on public.student_invites (created_by, created_at desc)
  where accepted_at is null and revoked_at is null;

comment on table public.student_invites is
  'Single-use student invitations. token_hash is sha256(raw token) — the raw '
  'token exists only in the emailed/copied link and is never stored.';

-- ── Work queued for a student who has not signed up yet ─────────────────────

create table public.pending_assignments (
  -- Deliberately NOT defaulted: the caller supplies the id the real assignment
  -- will take, so materials uploaded now are already at their final path.
  id           uuid primary key,
  invite_id    uuid not null references public.student_invites (id) on delete cascade,
  tutor_id     uuid not null references public.profiles (id) on delete cascade,
  type         public.assignment_type not null default 'problem_set',
  title        text not null,
  description  text,
  category_id  uuid references public.categories (id) on delete set null,
  due_at       timestamptz not null,
  created_at   timestamptz not null default now(),
  constraint pending_assignments_title_not_blank check (length(trim(title)) > 0)
);

create index pending_assignments_invite_idx
  on public.pending_assignments (invite_id);

create table public.pending_assignment_files (
  id                    uuid primary key default gen_random_uuid(),
  pending_assignment_id uuid not null
    references public.pending_assignments (id) on delete cascade,
  storage_path          text not null,
  file_name             text not null default '',
  mime_type             text not null,
  size_bytes            bigint,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  constraint pending_files_mime_allowed check (
    mime_type in ('application/pdf', 'image/png', 'image/jpeg')
  ),
  constraint pending_files_size_limit check (
    size_bytes is null or size_bytes <= 20971520
  )
);

create index pending_assignment_files_parent_idx
  on public.pending_assignment_files (pending_assignment_id, sort_order);

-- ── Redemption ──────────────────────────────────────────────────────────────

create function private.redeem_invite(
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
    (id, tutor_id, student_id, type, title, description, category_id, due_at, created_at)
  select
    pa.id, pa.tutor_id, p_user_id, pa.type, pa.title, pa.description,
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

-- Same shape as the rate limiter: the logic lives in `private`, and one thin
-- wrapper in `public` is reachable by the service role alone.
create function public.redeem_invite(p_token_hash text, p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = private, public, pg_temp
as $$
  select private.redeem_invite(p_token_hash, p_user_id);
$$;

revoke all on function private.redeem_invite(text, uuid) from public, anon, authenticated;
revoke all on function public.redeem_invite(text, uuid)  from public, anon, authenticated;
grant execute on function public.redeem_invite(text, uuid) to service_role;

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.student_invites          enable row level security;
alter table public.pending_assignments      enable row level security;
alter table public.pending_assignment_files enable row level security;

-- Only the tutor ever reads these through the API. Redemption happens with the
-- service role, so an unauthenticated visitor needs no policy here at all —
-- which means a stolen token cannot be used to enumerate the invite table.
create policy "invites managed by their tutor"
  on public.student_invites for all to authenticated
  using (private.is_tutor() and created_by = auth.uid())
  with check (private.is_tutor() and created_by = auth.uid());

create policy "pending assignments managed by their tutor"
  on public.pending_assignments for all to authenticated
  using (private.is_tutor() and tutor_id = auth.uid())
  with check (private.is_tutor() and tutor_id = auth.uid());

create policy "pending files managed by tutor"
  on public.pending_assignment_files for all to authenticated
  using (private.is_tutor())
  with check (private.is_tutor());
