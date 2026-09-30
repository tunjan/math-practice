-- ============================================================================
-- 0023 — More than one tutor
--
-- Until now "the tutor" was a role and nothing more: every policy that said
-- is_tutor() meant "the one tutor there is". With a second tutor that reads as
-- "any tutor", and each would see the other's students and their work.
--
-- This gives every student exactly one tutor (profiles.tutor_id, set when an
-- invite is redeemed) and rewrites each role-wide policy to ask the narrower
-- question: is this *my* student, *my* task, *my* topic list.
--
-- Nothing changes for the existing tutor: their students are linked to them
-- below, and they go on seeing exactly what they saw before.
-- ============================================================================

-- ── The link ────────────────────────────────────────────────────────────────

-- `set null` rather than cascade: a tutor closing their account must not take
-- their students' logins with it. A student with no tutor sees only themself.
alter table public.profiles
  add column tutor_id uuid references public.profiles (id) on delete set null;

create index profiles_tutor_idx on public.profiles (tutor_id) where tutor_id is not null;

comment on column public.profiles.tutor_id is
  'The tutor a student belongs to. Set by redeem_invite(); null for tutors.';

-- Backfill before the guard below is replaced: the new guard freezes tutor_id
-- for every caller but the service role, and a migration is not one.
--
-- The invite a student redeemed names their tutor. Anyone who predates invites
-- falls to the first tutor, which on a single-tutor database is the only one.
update public.profiles p
   set tutor_id = i.created_by
  from public.student_invites i
 where i.accepted_user_id = p.id
   and p.role = 'student';

update public.profiles p
   set tutor_id = (
     select t.id from public.profiles t
      where t.role = 'tutor'
      order by t.created_at
      limit 1
   )
 where p.role = 'student'
   and p.tutor_id is null;

alter table public.profiles
  add constraint profiles_only_students_have_a_tutor
  check (role = 'student' or tutor_id is null);

-- ── Helpers ─────────────────────────────────────────────────────────────────
--
-- SECURITY DEFINER for the same reason is_tutor() is: a policy on `profiles`
-- that read `profiles` directly would recurse.

create function private.my_tutor_id()
returns uuid
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select tutor_id from public.profiles where id = auth.uid();
$$;

create function private.is_my_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = p_student
       and p.role = 'student'
       and p.tutor_id = auth.uid()
  );
$$;

create function private.tutors_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select exists (
    select 1
      from public.assignments a
     where a.id = p_assignment_id
       and a.tutor_id = auth.uid()
  );
$$;

-- Materials are uploaded to <assignment_id>/… before the task row exists, and
-- for a queued task the id belongs to pending_assignments instead. So a folder
-- is a tutor's if the task is theirs, or if nobody has claimed the id yet.
create function private.owns_material_folder(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select p_assignment_id is not null
     and case
           when exists (select 1 from public.assignments a where a.id = p_assignment_id)
             then exists (
               select 1 from public.assignments a
                where a.id = p_assignment_id and a.tutor_id = auth.uid()
             )
           when exists (select 1 from public.pending_assignments pa where pa.id = p_assignment_id)
             then exists (
               select 1 from public.pending_assignments pa
                where pa.id = p_assignment_id and pa.tutor_id = auth.uid()
             )
           else true
         end;
$$;

revoke all on function private.my_tutor_id()              from public, anon, authenticated;
revoke all on function private.is_my_student(uuid)        from public, anon, authenticated;
revoke all on function private.tutors_assignment(uuid)    from public, anon, authenticated;
revoke all on function private.owns_material_folder(uuid) from public, anon, authenticated;

grant execute on function private.my_tutor_id()              to authenticated;
grant execute on function private.is_my_student(uuid)        to authenticated;
grant execute on function private.tutors_assignment(uuid)    to authenticated;
grant execute on function private.owns_material_folder(uuid) to authenticated;

-- ── profiles ────────────────────────────────────────────────────────────────

drop policy "profiles readable by tutor" on public.profiles;
create policy "profiles readable by their tutor"
  on public.profiles for select to authenticated
  using (tutor_id = (select auth.uid()));

drop policy "profiles updatable by tutor" on public.profiles;
create policy "profiles updatable by their tutor"
  on public.profiles for update to authenticated
  using (tutor_id = (select auth.uid()))
  with check (tutor_id = (select auth.uid()));

-- The old guard waved any tutor through, which was fine when a tutor could not
-- do harm to another. Now nobody signed in may move a profile between roles or
-- tutors; a student's course is set by their own tutor and no one else.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  new.role := old.role;
  new.id := old.id;
  new.created_at := old.created_at;
  new.calendar_token := old.calendar_token;
  new.tutor_id := old.tutor_id;

  if old.tutor_id is distinct from auth.uid() then
    new.programme := old.programme;
    new.course := old.course;
    new.level := old.level;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_profile_update() from public, anon, authenticated;

-- ── categories ──────────────────────────────────────────────────────────────
--
-- Each tutor keeps their own topic list; a student reads their tutor's.

drop index public.categories_name_key;
create unique index categories_owner_name_key
  on public.categories (created_by, lower(trim(name)));

comment on table public.categories is
  'A tutor''s topic taxonomy. Used by both assignment tagging and the library.';

drop policy "categories readable by all signed in" on public.categories;
create policy "categories readable by their tutor and students"
  on public.categories for select to authenticated
  using (
    created_by = (select auth.uid())
    or created_by = (select private.my_tutor_id())
  );

drop policy "categories writable by tutor" on public.categories;
create policy "categories writable by their tutor"
  on public.categories for all to authenticated
  using (private.is_tutor() and created_by = (select auth.uid()))
  with check (private.is_tutor() and created_by = (select auth.uid()));

-- ── assignments ─────────────────────────────────────────────────────────────

drop policy "assignments readable by tutor" on public.assignments;
create policy "assignments readable by their tutor"
  on public.assignments for select to authenticated
  using (tutor_id = (select auth.uid()));

-- The category subquery runs under the caller's own categories policy, so it
-- only finds a topic from their own list.
drop policy "assignments created by tutor" on public.assignments;
create policy "assignments created by tutor for their student"
  on public.assignments for insert to authenticated
  with check (
    private.is_tutor()
    and tutor_id = (select auth.uid())
    and private.is_my_student(student_id)
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id))
  );

drop policy "assignments updatable by tutor" on public.assignments;
create policy "assignments updatable by their tutor"
  on public.assignments for update to authenticated
  using (tutor_id = (select auth.uid()))
  with check (
    tutor_id = (select auth.uid())
    and private.is_my_student(student_id)
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id))
  );

drop policy "assignments deletable by tutor" on public.assignments;
create policy "assignments deletable by their tutor"
  on public.assignments for delete to authenticated
  using (tutor_id = (select auth.uid()));

drop policy "assignment files writable by tutor" on public.assignment_files;
create policy "assignment files writable by the task's tutor"
  on public.assignment_files for all to authenticated
  using (private.tutors_assignment(assignment_id))
  with check (private.tutors_assignment(assignment_id));

drop policy "submissions removable by tutor" on public.submissions;
create policy "submissions removable by the task's tutor"
  on public.submissions for delete to authenticated
  using (private.tutors_assignment(assignment_id));

drop policy "assignment topics managed by tutor" on public.assignment_topics;
create policy "assignment topics managed by the task's tutor"
  on public.assignment_topics for all to authenticated
  using (private.tutors_assignment(assignment_id))
  with check (private.tutors_assignment(assignment_id));

-- ── Work queued against an invite ───────────────────────────────────────────
--
-- Both subqueries lean on the parent table's policy: an invite or a queued
-- task is only found if it is the caller's own.

drop policy "pending assignments managed by their tutor" on public.pending_assignments;
create policy "pending assignments managed by their tutor"
  on public.pending_assignments for all to authenticated
  using (private.is_tutor() and tutor_id = (select auth.uid()))
  with check (
    private.is_tutor()
    and tutor_id = (select auth.uid())
    and exists (select 1 from public.student_invites i where i.id = invite_id)
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id))
  );

drop policy "pending files managed by tutor" on public.pending_assignment_files;
create policy "pending files managed by the task's tutor"
  on public.pending_assignment_files for all to authenticated
  using (exists (select 1 from public.pending_assignments pa where pa.id = pending_assignment_id))
  with check (exists (select 1 from public.pending_assignments pa where pa.id = pending_assignment_id));

-- ── Syllabus tracker and exams ──────────────────────────────────────────────

drop policy "topic progress managed by tutor" on public.topic_progress;
create policy "topic progress managed by the student's tutor"
  on public.topic_progress for all to authenticated
  using (private.is_my_student(student_id))
  with check (private.is_my_student(student_id));

drop policy "exams managed by tutor" on public.exams;
create policy "exams managed by the student's tutor"
  on public.exams for all to authenticated
  using (private.is_my_student(student_id))
  with check (private.is_my_student(student_id));

-- ── Calendar sharing ────────────────────────────────────────────────────────
--
-- Was "anyone holding the other role". Now a tutor shares with their own
-- student, and a student with their own tutor.

create or replace function private.can_share_event_with(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select p_target is null
      or private.is_my_student(p_target)
      or p_target = private.my_tutor_id();
$$;

revoke all on function private.can_share_event_with(uuid) from public, anon, authenticated;
grant execute on function private.can_share_event_with(uuid) to authenticated;

-- ── Storage ─────────────────────────────────────────────────────────────────

drop policy "materials writable by tutor" on storage.objects;
create policy "materials writable by the task's tutor"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assignment-materials'
    and private.is_tutor()
    and private.owns_material_folder(private.safe_uuid((storage.foldername(name))[1]))
  );

drop policy "materials updatable by tutor" on storage.objects;
create policy "materials updatable by the task's tutor"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'assignment-materials'
    and private.is_tutor()
    and private.owns_material_folder(private.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'assignment-materials'
    and private.is_tutor()
    and private.owns_material_folder(private.safe_uuid((storage.foldername(name))[1]))
  );

drop policy "materials removable by tutor" on storage.objects;
create policy "materials removable by the task's tutor"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'assignment-materials'
    and private.is_tutor()
    and private.owns_material_folder(private.safe_uuid((storage.foldername(name))[1]))
  );

drop policy "submitted work removable by tutor" on storage.objects;
create policy "submitted work removable by the task's tutor"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'submissions'
    and private.tutors_assignment(private.safe_uuid((storage.foldername(name))[1]))
  );

-- library/<category_id>/…: follows the category. `objects.name` is spelled out
-- because categories has a `name` of its own, which would otherwise win.
drop policy "library readable by all signed in" on storage.objects;
create policy "library readable with its category"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'library'
    and exists (
      select 1 from public.categories c
       where c.id = private.safe_uuid((storage.foldername(objects.name))[1])
    )
  );

drop policy "library writable by tutor" on storage.objects;
create policy "library writable by the category's tutor"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'library'
    and exists (
      select 1 from public.categories c
       where c.id = private.safe_uuid((storage.foldername(objects.name))[1])
         and c.created_by = (select auth.uid())
    )
  );

drop policy "library updatable by tutor" on storage.objects;
create policy "library updatable by the category's tutor"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'library'
    and exists (
      select 1 from public.categories c
       where c.id = private.safe_uuid((storage.foldername(objects.name))[1])
         and c.created_by = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'library'
    and exists (
      select 1 from public.categories c
       where c.id = private.safe_uuid((storage.foldername(objects.name))[1])
         and c.created_by = (select auth.uid())
    )
  );

drop policy "library removable by tutor" on storage.objects;
create policy "library removable by the category's tutor"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'library'
    and exists (
      select 1 from public.categories c
       where c.id = private.safe_uuid((storage.foldername(objects.name))[1])
         and c.created_by = (select auth.uid())
    )
  );

-- ── Redeeming an invite now joins the student to its tutor ──────────────────

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

  -- Whoever issued the link is the tutor. The student must be a fresh account:
  -- an invite never moves someone who already has a tutor, or is one.
  update public.profiles
  set tutor_id = v_invite.created_by
  where id = p_user_id
    and role = 'student'
    and tutor_id is null;

  if not found then
    raise exception 'invite can only be redeemed by a new student account';
  end if;

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
