-- Make school_id nullable in grade10_videos and grade10_documents for system-wide content
ALTER TABLE public.grade10_videos ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE public.grade10_documents ALTER COLUMN school_id DROP NOT NULL;

-- Also update the grade12 tables to be consistent
ALTER TABLE public.grade12_videos ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE public.grade12_documents ALTER COLUMN school_id DROP NOT NULL;

-- Update RLS policies to allow viewing content without school restriction
DROP POLICY IF EXISTS "School members can view grade 10 videos" ON public.grade10_videos;
DROP POLICY IF EXISTS "School members can view grade 10 documents" ON public.grade10_documents;
DROP POLICY IF EXISTS "School members can view grade 12 videos" ON public.grade12_videos;
DROP POLICY IF EXISTS "School members can view grade 12 documents" ON public.grade12_documents;

-- Create new policies that allow viewing all content
CREATE POLICY "All authenticated users can view grade 10 videos" 
ON public.grade10_videos 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view grade 10 documents" 
ON public.grade10_documents 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view grade 12 videos" 
ON public.grade12_videos 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view grade 12 documents" 
ON public.grade12_documents 
FOR SELECT 
USING (auth.role() = 'authenticated');