-- Add visibility and control fields to grade11_documents table
ALTER TABLE public.grade11_documents 
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_scope text DEFAULT 'all' CHECK (visibility_scope IN ('all', 'school_admin', 'teacher', 'student')),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone DEFAULT now();

-- Create storage bucket for Grade 11 documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('grade11-documents', 'grade11-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for Grade 11 documents
CREATE POLICY "Authenticated users can view grade11 documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'grade11-documents' AND auth.role() = 'authenticated');

CREATE POLICY "School admins can upload grade11 documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'grade11-documents' 
  AND auth.uid() IS NOT NULL 
  AND (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  )
);

CREATE POLICY "School admins can update grade11 documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'grade11-documents' 
  AND auth.uid() IS NOT NULL 
  AND (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  )
);

CREATE POLICY "School admins can delete grade11 documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'grade11-documents' 
  AND auth.uid() IS NOT NULL 
  AND (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  )
);

-- Update RLS policies for grade11_documents to include visibility controls
DROP POLICY IF EXISTS "Authenticated users can view grade11 documents" ON public.grade11_documents;
DROP POLICY IF EXISTS "School admins can manage grade11 documents" ON public.grade11_documents;

CREATE POLICY "Users can view visible grade11 documents based on scope"
ON public.grade11_documents FOR SELECT
USING (
  is_active = true 
  AND is_visible = true 
  AND (
    visibility_scope = 'all' 
    OR (
      visibility_scope = 'school_admin' 
      AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
    )
    OR (
      visibility_scope = 'teacher' 
      AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
    )
    OR (
      visibility_scope = 'student' 
      AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['student'::app_role, 'teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
    )
  )
  AND auth.role() = 'authenticated'
);

CREATE POLICY "School admins can manage all grade11 documents"
ON public.grade11_documents FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  AND (
    (SELECT school_id FROM public.profiles WHERE user_id = auth.uid()) = school_id 
    OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'superadmin'::app_role
  )
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  AND (
    (SELECT school_id FROM public.profiles WHERE user_id = auth.uid()) = school_id 
    OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'superadmin'::app_role
  )
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_grade11_documents_visibility 
ON public.grade11_documents(is_visible, is_active, visibility_scope);

CREATE INDEX IF NOT EXISTS idx_grade11_documents_order 
ON public.grade11_documents(order_index, created_at);