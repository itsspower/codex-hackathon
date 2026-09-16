-- Public signup may create only non-admin application roles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  assigned_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';
  assigned_role := case requested_role
    when 'student' then 'student'
    when 'alumni' then 'alumni'
    when 'business' then 'business'
    else 'student'
  end;

  insert into public.profiles (id, role)
  values (new.id, assigned_role);

  return new;
end;
$$;
