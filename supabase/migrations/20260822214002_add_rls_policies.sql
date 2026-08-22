-- Helper: get the role of the currently logged-in user
create or replace function public.current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============ PROFILES ============
create policy "profiles: anyone logged in can view roles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles: user can insert own row"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: user can update own row"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles: admin full access"
  on public.profiles for all
  using (public.is_admin());

-- ============ STUDENT PROFILES ============
create policy "student_profiles: owner can manage"
  on public.student_profiles for all
  using (user_id = auth.uid());

create policy "student_profiles: business/alumni can view applicants"
  on public.student_profiles for select
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.student_id = student_profiles.user_id
      and o.posted_by = auth.uid()
    )
  );

create policy "student_profiles: admin full access"
  on public.student_profiles for all
  using (public.is_admin());

-- ============ BUSINESS PROFILES ============
create policy "business_profiles: anyone logged in can view"
  on public.business_profiles for select
  using (auth.role() = 'authenticated');

create policy "business_profiles: owner can manage"
  on public.business_profiles for all
  using (user_id = auth.uid());

create policy "business_profiles: admin full access"
  on public.business_profiles for all
  using (public.is_admin());

-- ============ ALUMNI PROFILES ============
create policy "alumni_profiles: anyone logged in can view"
  on public.alumni_profiles for select
  using (auth.role() = 'authenticated');

create policy "alumni_profiles: owner can manage"
  on public.alumni_profiles for all
  using (user_id = auth.uid());

create policy "alumni_profiles: admin full access"
  on public.alumni_profiles for all
  using (public.is_admin());

-- ============ OPPORTUNITIES ============
create policy "opportunities: anyone logged in can view"
  on public.opportunities for select
  using (auth.role() = 'authenticated');

create policy "opportunities: business/alumni can create"
  on public.opportunities for insert
  with check (
    posted_by = auth.uid()
    and public.current_role() in ('business','alumni')
  );

create policy "opportunities: owner can update/delete"
  on public.opportunities for update
  using (posted_by = auth.uid());

create policy "opportunities: owner can delete"
  on public.opportunities for delete
  using (posted_by = auth.uid());

create policy "opportunities: admin full access"
  on public.opportunities for all
  using (public.is_admin());

-- ============ APPLICATIONS ============
create policy "applications: student can view own"
  on public.applications for select
  using (student_id = auth.uid());

create policy "applications: owner can view received"
  on public.applications for select
  using (
    exists (select 1 from public.opportunities o where o.id = opportunity_id and o.posted_by = auth.uid())
  );

create policy "applications: student can submit"
  on public.applications for insert
  with check (student_id = auth.uid() and public.current_role() = 'student');

create policy "applications: owner can update status"
  on public.applications for update
  using (
    exists (select 1 from public.opportunities o where o.id = opportunity_id and o.posted_by = auth.uid())
  );

create policy "applications: admin full access"
  on public.applications for all
  using (public.is_admin());

-- ============ APPLICATION STATUS HISTORY ============
create policy "status_history: student can view own application's history"
  on public.application_status_history for select
  using (
    exists (select 1 from public.applications a where a.id = application_id and a.student_id = auth.uid())
  );

create policy "status_history: owner can view/insert"
  on public.application_status_history for select
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.posted_by = auth.uid()
    )
  );

create policy "status_history: owner can insert"
  on public.application_status_history for insert
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.posted_by = auth.uid()
    )
  );

create policy "status_history: admin full access"
  on public.application_status_history for all
  using (public.is_admin());

-- ============ MENTORSHIP REQUESTS ============
create policy "mentorship: student can view own sent"
  on public.mentorship_requests for select
  using (student_id = auth.uid());

create policy "mentorship: alumni can view received"
  on public.mentorship_requests for select
  using (alumni_id = auth.uid());

create policy "mentorship: student can send"
  on public.mentorship_requests for insert
  with check (student_id = auth.uid() and public.current_role() = 'student');

create policy "mentorship: alumni can accept/decline"
  on public.mentorship_requests for update
  using (alumni_id = auth.uid());

create policy "mentorship: admin full access"
  on public.mentorship_requests for all
  using (public.is_admin());

-- ============ NOTIFICATIONS ============
create policy "notifications: user can view own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications: user can mark own as read"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications: admin full access"
  on public.notifications for all
  using (public.is_admin());

-- ============ CHATBOT LOGS ============
create policy "chatbot_logs: user can view own"
  on public.chatbot_logs for select
  using (user_id = auth.uid());

create policy "chatbot_logs: user can insert own"
  on public.chatbot_logs for insert
  with check (user_id = auth.uid());