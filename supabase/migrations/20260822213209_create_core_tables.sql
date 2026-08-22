-- Shared profile + role table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','business','alumni','admin')),
  created_at timestamptz default now()
);

-- Student-specific fields
create table public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  name text,
  surname text,
  campus text,
  course text,
  interests text[]
);

-- Business-specific fields
create table public.business_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  business_phone text,
  business_website text,
  industry_category text,
  company_description text,
  location text,
  contact_person_name text,
  skills_sought text[],
  verification_status text default 'pending' check (verification_status in ('pending','verified','rejected'))
);

-- Alumni-specific fields
create table public.alumni_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  first_name text,
  last_name text,
  graduation_year int,
  qualification text,
  current_job_title text,
  current_company text,
  industry text,
  skills_interests text[],
  years_experience int,
  bio text,
  mentorship_interests text[],
  verification_status text default 'pending' check (verification_status in ('pending','verified','rejected'))
);

-- Opportunities
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  opportunity_type text,
  industry text,
  skills_required text[],
  experience_level text,
  location text,
  work_arrangement text,
  company_organisation text,
  application_deadline date,
  application_instructions text,
  status text default 'open' check (status in ('open','closed','filled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  status text default 'submitted' check (status in ('submitted','under_review','shortlisted','accepted','rejected')),
  cover_letter text,
  cv_url text,
  additional_documents_url text,
  recruiter_notes text,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Application status history
create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz default now()
);

-- Mentorship requests
create table public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  alumni_id uuid references public.profiles(id) on delete cascade,
  message text,
  status text default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  message text not null,
  type text,
  read_status boolean default false,
  created_at timestamptz default now()
);

-- Chatbot conversation log
create table public.chatbot_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  conversation_id uuid not null,
  user_message text,
  ai_response text,
  created_at timestamptz default now()
);

-- Lock everything down by default — no one can read/write yet.
-- This is intentional: we add specific permission policies (from the Permission Map) next.
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.alumni_profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.mentorship_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.chatbot_logs enable row level security;