-- ============================================================================
-- 0003 — Storage buckets and their access rules
--
-- All three buckets are private. Nothing is served by public URL; the app mints
-- short-lived signed URLs after the row-level check below has already passed.
--
-- Path conventions, which the policies depend on:
--   assignment-materials/<assignment_id>/<uuid>.<ext>
--   submissions/<assignment_id>/<student_id>/<uuid>.<ext>
--   library/<category_id>/<uuid>.<ext>
-- ============================================================================

-- A path segment that should be a uuid may not be one — a hand-crafted upload
-- could put anything there. Casting directly would raise and surface as a 500,
-- so parse defensively and let the policy simply fail closed on null.
create function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception
  when others then
    return null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('assignment-materials', 'assignment-materials', false, 20971520,
   array['application/pdf', 'image/png', 'image/jpeg']),
  ('submissions', 'submissions', false, 20971520,
   array['application/pdf', 'image/png', 'image/jpeg']),
  ('library', 'library', false, 20971520,
   array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- ── assignment-materials ────────────────────────────────────────────────────

create policy "materials readable by assignment participants"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'assignment-materials'
    and public.can_access_assignment(
      public.safe_uuid((storage.foldername(name))[1])
    )
  );

create policy "materials writable by tutor"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'assignment-materials' and public.is_tutor());

create policy "materials updatable by tutor"
  on storage.objects for update to authenticated
  using (bucket_id = 'assignment-materials' and public.is_tutor())
  with check (bucket_id = 'assignment-materials' and public.is_tutor());

create policy "materials removable by tutor"
  on storage.objects for delete to authenticated
  using (bucket_id = 'assignment-materials' and public.is_tutor());

-- ── submissions ─────────────────────────────────────────────────────────────

create policy "submitted work readable by assignment participants"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and public.can_access_assignment(
      public.safe_uuid((storage.foldername(name))[1])
    )
  );

-- A student may only write under their own id, inside an assignment that is
-- actually theirs.
create policy "submitted work writable by its student"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and public.safe_uuid((storage.foldername(name))[2]) = auth.uid()
    and public.can_access_assignment(
      public.safe_uuid((storage.foldername(name))[1])
    )
  );

create policy "submitted work removable by its student"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'submissions'
    and public.safe_uuid((storage.foldername(name))[2]) = auth.uid()
  );

create policy "submitted work removable by tutor"
  on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and public.is_tutor());

-- ── library ─────────────────────────────────────────────────────────────────

create policy "library readable by all signed in"
  on storage.objects for select to authenticated
  using (bucket_id = 'library');

create policy "library writable by tutor"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'library' and public.is_tutor());

create policy "library updatable by tutor"
  on storage.objects for update to authenticated
  using (bucket_id = 'library' and public.is_tutor())
  with check (bucket_id = 'library' and public.is_tutor());

create policy "library removable by tutor"
  on storage.objects for delete to authenticated
  using (bucket_id = 'library' and public.is_tutor());
