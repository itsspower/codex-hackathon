alter table public.student_profiles
  add column if not exists qualifications text,
  add column if not exists experience text,
  add column if not exists certifications text,
  add column if not exists cv_url text,
  add column if not exists cv_file_name text,
  add column if not exists cv_uploaded_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do nothing;
