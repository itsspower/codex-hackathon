-- Students can upload their own CV
create policy "cvs: student can upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can view/replace their own CV
create policy "cvs: student can manage own"
  on storage.objects for all
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Business/Alumni can view CVs of students who applied to their opportunities
create policy "cvs: owner can view applicant cv"
  on storage.objects for select
  using (
    bucket_id = 'cvs'
    and exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.student_id::text = (storage.foldername(name))[1]
      and o.posted_by = auth.uid()
    )
  );

-- Admin can view all CVs
create policy "cvs: admin full access"
  on storage.objects for all
  using (
    bucket_id = 'cvs'
    and public.is_admin()
  );