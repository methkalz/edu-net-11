-- Create grade10_documents table with same structure as grade11_documents
CREATE TABLE public.grade10_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'materials',
  grade_level TEXT NOT NULL DEFAULT '10',
  owner_user_id UUID NOT NULL,
  school_id UUID,
  is_visible BOOLEAN DEFAULT true,
  allowed_roles TEXT[] DEFAULT ARRAY['all'],
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grade10_videos table
CREATE TABLE public.grade10_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  source_type TEXT DEFAULT 'youtube' CHECK (source_type IN ('youtube', 'vimeo', 'direct')),
  category TEXT,
  grade_level TEXT NOT NULL DEFAULT '10',
  owner_user_id UUID NOT NULL,
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.grade10_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for grade10_documents
CREATE POLICY "School admins can manage grade10 documents" 
ON public.grade10_documents 
FOR ALL 
USING (
  (get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
)
WITH CHECK (
  (get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "Users can view visible grade10 documents based on allowed roles" 
ON public.grade10_documents 
FOR SELECT 
USING (
  is_active = true 
  AND is_visible = true 
  AND (
    'all' = ANY(allowed_roles) 
    OR ('school_admin' = ANY(allowed_roles) AND get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])) 
    OR ('teacher' = ANY(allowed_roles) AND get_user_role() = ANY(ARRAY['teacher', 'school_admin', 'superadmin']::app_role[])) 
    OR ('student' = ANY(allowed_roles) AND get_user_role() = ANY(ARRAY['student', 'teacher', 'school_admin', 'superadmin']::app_role[])) 
    OR ('parent' = ANY(allowed_roles) AND get_user_role() = ANY(ARRAY['parent', 'teacher', 'school_admin', 'superadmin']::app_role[]))
  ) 
  AND auth.role() = 'authenticated'
);

-- RLS policies for grade10_videos
CREATE POLICY "School admins can manage grade10 videos" 
ON public.grade10_videos 
FOR ALL 
USING (
  (get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "All authenticated users can view grade10 videos" 
ON public.grade10_videos 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_grade10_documents_school_id ON public.grade10_documents(school_id);
CREATE INDEX idx_grade10_documents_category ON public.grade10_documents(category);
CREATE INDEX idx_grade10_documents_order_index ON public.grade10_documents(order_index);
CREATE INDEX idx_grade10_documents_published_at ON public.grade10_documents(published_at);

CREATE INDEX idx_grade10_videos_school_id ON public.grade10_videos(school_id);
CREATE INDEX idx_grade10_videos_created_at ON public.grade10_videos(created_at);

-- Create storage bucket for grade10 documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('grade10-documents', 'grade10-documents', false);

-- Create storage policies for grade10-documents bucket
CREATE POLICY "School admins can view grade10 documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'grade10-documents' 
  AND (
    get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[]) 
    OR auth.role() = 'authenticated'
  )
);

CREATE POLICY "School admins can upload grade10 documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'grade10-documents' 
  AND get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])
);

CREATE POLICY "School admins can update grade10 documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'grade10-documents' 
  AND get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])
);

CREATE POLICY "School admins can delete grade10 documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'grade10-documents' 
  AND get_user_role() = ANY(ARRAY['school_admin', 'superadmin']::app_role[])
);