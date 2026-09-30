-- ============================================================================
-- 0024 — Tutors sign themselves up
--
-- handle_new_user() used to make the first account the tutor and everyone
-- after a student. With open sign-up that rule is wrong twice over: a second
-- tutor could never exist, and on an empty database the first student to
-- redeem anything would have become one.
--
-- Every new account now starts as a student with no tutor, which can see
-- nothing but itself. The two ways in each finish the job with the service
-- role, after their own checks:
--   · /signup promotes the account to tutor,
--   · redeem_invite() attaches it to the inviting tutor.
--
-- The role is still never read from anything the client can write.
-- ============================================================================

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    'student',
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    new.email
  );

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
