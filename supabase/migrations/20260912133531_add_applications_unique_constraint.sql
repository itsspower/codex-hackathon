ALTER TABLE public.applications
ADD CONSTRAINT applications_student_opportunity_unique
UNIQUE (student_id, opportunity_id);
