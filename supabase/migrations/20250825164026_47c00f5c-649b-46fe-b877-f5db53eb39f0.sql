-- Create Grade 11 documents table
CREATE TABLE public.grade11_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL CHECK (category IN ('bagrut_exam', 'worksheets', 'exams')),
  grade_level TEXT NOT NULL DEFAULT '11',
  owner_user_id UUID NOT NULL,
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Grade 11 videos table
CREATE TABLE public.grade11_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  source_type TEXT DEFAULT 'youtube' CHECK (source_type IN ('youtube', 'vimeo', 'direct')),
  category TEXT,
  grade_level TEXT NOT NULL DEFAULT '11',
  owner_user_id UUID NOT NULL,
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grade11_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grade11_documents
CREATE POLICY "Authenticated users can view grade11 documents"
ON public.grade11_documents
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "School admins can manage grade11 documents"
ON public.grade11_documents
FOR ALL
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- RLS Policies for grade11_videos
CREATE POLICY "Authenticated users can view grade11 videos"
ON public.grade11_videos
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "School admins can manage grade11 videos"
ON public.grade11_videos
FOR ALL
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- Create update triggers
CREATE TRIGGER update_grade11_documents_updated_at
  BEFORE UPDATE ON public.grade11_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade11_videos_updated_at
  BEFORE UPDATE ON public.grade11_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();