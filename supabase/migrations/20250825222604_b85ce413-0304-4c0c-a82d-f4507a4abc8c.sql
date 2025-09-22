-- Drop the existing policy first
DROP POLICY IF EXISTS "Users can view visible grade11 documents based on scope" ON public.grade11_documents CASCADE;

-- Now safely drop the column
ALTER TABLE public.grade11_documents 
DROP COLUMN IF EXISTS visibility_scope CASCADE;

-- Add the new column for multiple roles
ALTER TABLE public.grade11_documents 
ADD COLUMN allowed_roles text[] DEFAULT ARRAY['all'];

-- Create new RLS policy for multiple roles
CREATE POLICY "Users can view visible grade11 documents based on allowed roles"
ON public.grade11_documents FOR SELECT
USING (
  is_active = true 
  AND is_visible = true 
  AND (
    'all' = ANY(allowed_roles)
    OR (
      'school_admin' = ANY(allowed_roles) 
      AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
    )
    OR (
      'teacher' = ANY(allowed_roles) 
      AND get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
    )
    OR (
      'student' = ANY(allowed_roles) 
      AND get_user_role() = ANY(ARRAY['student'::app_role, 'teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
    )
    OR (
      'parent' = ANY(allowed_roles) 
      AND get_user_role() = ANY(ARRAY['parent'::app_role, 'teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
    )
  )
  AND auth.role() = 'authenticated'
);

-- Add index for better performance on array queries
CREATE INDEX IF NOT EXISTS idx_grade11_documents_allowed_roles 
ON public.grade11_documents USING GIN(allowed_roles);