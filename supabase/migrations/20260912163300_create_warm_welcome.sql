create table public.warm_welcome_matches (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  alumni_id uuid references public.alumni_profiles(user_id) on delete set null,
  skill_overlap_count integer not null default 0,
  qualification_match boolean not null default false,
  match_score integer not null default 0,
  queue_position integer,
  status text not null check (status in ('no_alumni_available', 'matched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index warm_welcome_matches_application_id_idx
  on public.warm_welcome_matches (application_id);

create index warm_welcome_matches_alumni_id_idx
  on public.warm_welcome_matches (alumni_id)
  where alumni_id is not null;

alter table public.warm_welcome_matches enable row level security;

create policy "warm welcome: student can view own match"
  on public.warm_welcome_matches for select
  using (
    exists (
      select 1
      from public.applications a
      where a.id = warm_welcome_matches.application_id
        and a.student_id = auth.uid()
    )
  );

create policy "warm welcome: alumni can view assigned match"
  on public.warm_welcome_matches for select
  using (alumni_id = auth.uid());

create policy "warm welcome: admin full access"
  on public.warm_welcome_matches for all
  using (public.is_admin());

create or replace function public.normalize_company_name(company_name text)
returns text
language sql
immutable
strict
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(company_name)), '\s+', ' ', 'g'),
        '\s+\(?\s*(pty|pvt)\s*\)?\s+ltd\.?$',
        '',
        'i'
      ),
      '\s+(ltd|limited|inc|incorporated|llc|corp|corporation)\.?$',
      '',
      'i'
    ),
    ''
  );
$$;

create or replace function public.process_warm_welcome(application_id uuid)
returns public.warm_welcome_matches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  application_record record;
  existing_match public.warm_welcome_matches;
  selected_alumni public.alumni_profiles%rowtype;
  student_record public.student_profiles%rowtype;
  opportunity_record public.opportunities%rowtype;
  result_match public.warm_welcome_matches;
  normalized_company text;
  skill_overlap integer := 0;
  qualification_matches boolean := false;
  computed_score integer := 0;
  next_position integer;
begin
  select a.student_id, a.opportunity_id, a.submitted_at
  into application_record
  from public.applications a
  where a.id = process_warm_welcome.application_id;

  if not found then
    raise exception 'Application % does not exist', process_warm_welcome.application_id;
  end if;

  if application_record.student_id <> auth.uid()
    and not public.is_admin()
  then
    raise exception 'You are not allowed to process this application';
  end if;

  select *
  into existing_match
  from public.warm_welcome_matches
  where warm_welcome_matches.application_id = process_warm_welcome.application_id;

  if found then
    return existing_match;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(application_record.opportunity_id::text, 0)
  );

  select *
  into existing_match
  from public.warm_welcome_matches
  where warm_welcome_matches.application_id = process_warm_welcome.application_id;

  if found then
    return existing_match;
  end if;

  select *
  into student_record
  from public.student_profiles
  where user_id = application_record.student_id;

  select *
  into opportunity_record
  from public.opportunities
  where id = application_record.opportunity_id;

  normalized_company := public.normalize_company_name(opportunity_record.company_organisation);

  if normalized_company is null then
    insert into public.warm_welcome_matches (
      application_id,
      status
    )
    values (
      process_warm_welcome.application_id,
      'no_alumni_available'
    )
    returning * into result_match;

    return result_match;
  end if;

  select ap.*
  into selected_alumni
  from public.alumni_profiles ap
  where public.normalize_company_name(ap.current_company) = normalized_company
  order by ap.years_experience desc nulls last, ap.user_id asc
  limit 1;

  if not found then
    insert into public.warm_welcome_matches (
      application_id,
      status
    )
    values (
      process_warm_welcome.application_id,
      'no_alumni_available'
    )
    returning * into result_match;

    return result_match;
  end if;

  select count(*)
  into skill_overlap
  from (
    select distinct lower(trim(student_skill)) as skill
    from unnest(coalesce(student_record.interests, array[]::text[])) as student_skill
    intersect
    select distinct lower(trim(alumni_skill)) as skill
    from unnest(coalesce(selected_alumni.skills_interests, array[]::text[])) as alumni_skill
  ) shared_skills;

  qualification_matches := (
    public.normalize_company_name(student_record.course) is not null
    and public.normalize_company_name(selected_alumni.qualification) is not null
    and (
      lower(trim(student_record.course)) = lower(trim(selected_alumni.qualification))
      or position(lower(trim(student_record.course)) in lower(trim(selected_alumni.qualification))) > 0
      or position(lower(trim(selected_alumni.qualification)) in lower(trim(student_record.course))) > 0
    )
  );

  computed_score := (skill_overlap * 10) + case when qualification_matches then 5 else 0 end;

  select count(*) + 1
  into next_position
  from public.warm_welcome_matches wwm
  join public.applications a on a.id = wwm.application_id
  where a.opportunity_id = application_record.opportunity_id
    and (
      wwm.match_score > computed_score
      or (
        wwm.match_score = computed_score
        and (
          a.submitted_at < application_record.submitted_at
          or (
            a.submitted_at = application_record.submitted_at
            and a.id < process_warm_welcome.application_id
          )
        )
      )
    );

  insert into public.warm_welcome_matches (
    application_id,
    alumni_id,
    skill_overlap_count,
    qualification_match,
    match_score,
    queue_position,
    status
  )
  values (
    process_warm_welcome.application_id,
    selected_alumni.user_id,
    skill_overlap,
    qualification_matches,
    computed_score,
    next_position,
    'matched'
  )
  returning * into result_match;

  return result_match;
end;
$$;
