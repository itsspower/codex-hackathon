create or replace function public.match_opportunities_for_student(p_student_id uuid)
returns table (
  opportunity_id uuid,
  title text,
  match_count int,
  matched_tags text[]
)
language sql
security definer
stable
as $$
  select
    o.id,
    o.title,
    cardinality(array(select unnest(o.skills_required) intersect select unnest(sp.interests))) as match_count,
    array(select unnest(o.skills_required) intersect select unnest(sp.interests)) as matched_tags
  from public.opportunities o
  cross join public.student_profiles sp
  where sp.user_id = p_student_id
    and o.status = 'open'
  order by match_count desc, o.created_at desc;
$$;