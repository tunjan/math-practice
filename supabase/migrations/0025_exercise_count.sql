-- ============================================================================
-- 0025 — Exercises instead of a percentage
--
-- A task can be a single question or a whole past paper, so "how far along,
-- 0–100%" said little either way. The tutor now says how many exercises a
-- task has (one unless they say otherwise) and the student ticks off how many
-- are done.
--
-- completion_pct also doubled as "has the student started": anything above
-- zero put the task in "In progress". That signal gets its own column,
-- started_at, so starting a task no longer claims an exercise is done.
-- ============================================================================

alter table public.assignments
  add column exercise_count integer not null default 1,
  add column exercises_done integer not null default 0,
  add column started_at     timestamptz,
  add constraint assignments_exercise_count_range check (exercise_count between 1 and 500),
  add constraint assignments_exercises_done_range check (
    exercises_done between 0 and exercise_count
  );

comment on column public.assignments.exercise_count is
  'Set by the tutor. 1 means the task is a single piece of work.';
comment on column public.assignments.exercises_done is
  'Student self-report, 0 to exercise_count. Deliberately independent of the tutor verdict.';
comment on column public.assignments.started_at is
  'When the student first said they had started. Written once.';

-- A percentage cannot be turned into a count, so only the started signal is
-- carried over. The open receipt is the closest thing to when that was.
update public.assignments
   set started_at = coalesce(student_opened_at, updated_at)
 where completion_pct > 0;

alter table public.assignments drop column completion_pct;

alter table public.pending_assignments
  add column exercise_count integer not null default 1,
  add constraint pending_assignments_exercise_count_range check (exercise_count between 1 and 500);

-- ── Student write guard ─────────────────────────────────────────────────────

create or replace function private.guard_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if private.is_tutor() then
    -- Fewer exercises than the student has already ticked off: they have done
    -- all of them.
    new.exercises_done := least(new.exercises_done, new.exercise_count);
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
  new.due_at := old.due_at;
  new.exercise_count := old.exercise_count;
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

  -- Likewise for starting.
  if old.started_at is not null then
    new.started_at := old.started_at;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_assignment_update() from public, anon, authenticated;

-- ── Queued work keeps its exercise count when the invite is redeemed ────────

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
    (id, tutor_id, student_id, type, difficulty, title, description, category_id, due_at,
     exercise_count, created_at)
  select
    pa.id, pa.tutor_id, p_user_id, pa.type, pa.difficulty, pa.title, pa.description,
    pa.category_id, pa.due_at, pa.exercise_count, pa.created_at
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
