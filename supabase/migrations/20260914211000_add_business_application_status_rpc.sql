create or replace function public.update_business_application_status(
  p_application_id uuid,
  p_status text
)
returns public.applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  current_application public.applications%rowtype;
  updated_application public.applications%rowtype;
begin
  select role
  into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role <> 'business' then
    raise exception 'Only business users can update application status';
  end if;

  if p_status not in ('submitted', 'under_review', 'shortlisted', 'accepted', 'rejected') then
    raise exception 'Invalid application status';
  end if;

  select a.*
  into current_application
  from public.applications a
  join public.opportunities o on o.id = a.opportunity_id
  where a.id = p_application_id
    and o.posted_by = auth.uid();

  if not found then
    raise exception 'Application not found or not owned by this business';
  end if;

  if current_application.status = p_status then
    return current_application;
  end if;

  update public.applications
  set status = p_status,
      updated_at = now()
  where id = p_application_id
  returning * into updated_application;

  insert into public.application_status_history (
    application_id,
    status,
    changed_by
  )
  values (
    p_application_id,
    p_status,
    auth.uid()
  );

  insert into public.notifications (
    user_id,
    message,
    type
  )
  values (
    updated_application.student_id,
    format('Your application status changed to %s.', p_status),
    'application_status_changed'
  );

  return updated_application;
end;
$$;

revoke execute on function public.update_business_application_status(uuid, text) from public;
grant execute on function public.update_business_application_status(uuid, text) to authenticated;
