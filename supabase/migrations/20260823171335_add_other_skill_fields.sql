alter table public.student_profiles add column if not exists interests_other text;
alter table public.business_profiles add column if not exists skills_sought_other text;
alter table public.opportunities add column if not exists skills_required_other text;