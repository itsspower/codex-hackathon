alter table public.opportunities
  drop constraint if exists opportunities_status_check;

alter table public.opportunities
  add constraint opportunities_status_check
  check (status in ('pending', 'open', 'rejected', 'closed', 'filled'));

alter table public.opportunities
  alter column status set default 'pending';

create or replace function public.prevent_non_admin_opportunity_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' and new.status is distinct from 'pending' then
      raise exception 'Only administrators can create opportunities with a non-pending status';
    end if;

    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      raise exception 'Only administrators can change opportunity status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_non_admin_opportunity_status_change on public.opportunities;

create trigger prevent_non_admin_opportunity_status_change
before insert or update on public.opportunities
for each row
execute function public.prevent_non_admin_opportunity_status_change();
