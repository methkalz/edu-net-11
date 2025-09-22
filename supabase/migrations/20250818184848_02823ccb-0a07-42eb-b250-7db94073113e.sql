-- إنشاء جدول فيديوهات الصف العاشر
CREATE TABLE public.grade10_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  source_type TEXT DEFAULT 'youtube',
  thumbnail_url TEXT,
  owner_user_id UUID NOT NULL,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مستندات الصف العاشر
CREATE TABLE public.grade10_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  owner_user_id UUID NOT NULL,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول فيديوهات الصف الثاني عشر
CREATE TABLE public.grade12_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  source_type TEXT DEFAULT 'youtube',
  thumbnail_url TEXT,
  owner_user_id UUID NOT NULL,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مستندات الصف الثاني عشر
CREATE TABLE public.grade12_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  owner_user_id UUID NOT NULL,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للجداول
ALTER TABLE public.grade10_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_documents ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لفيديوهات الصف العاشر
CREATE POLICY "Teachers can manage grade 10 videos" 
ON public.grade10_videos 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "School members can view grade 10 videos" 
ON public.grade10_videos 
FOR SELECT 
USING (
  school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role
);

-- سياسات RLS لمستندات الصف العاشر
CREATE POLICY "Teachers can manage grade 10 documents" 
ON public.grade10_documents 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "School members can view grade 10 documents" 
ON public.grade10_documents 
FOR SELECT 
USING (
  school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role
);

-- سياسات RLS لفيديوهات الصف الثاني عشر
CREATE POLICY "Teachers can manage grade 12 videos" 
ON public.grade12_videos 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "School members can view grade 12 videos" 
ON public.grade12_videos 
FOR SELECT 
USING (
  school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role
);

-- سياسات RLS لمستندات الصف الثاني عشر
CREATE POLICY "Teachers can manage grade 12 documents" 
ON public.grade12_documents 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "School members can view grade 12 documents" 
ON public.grade12_documents 
FOR SELECT 
USING (
  school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role
);

-- إنشاء فهارس للأداء
CREATE INDEX idx_grade10_videos_school_id ON public.grade10_videos(school_id);
CREATE INDEX idx_grade10_documents_school_id ON public.grade10_documents(school_id);
CREATE INDEX idx_grade12_videos_school_id ON public.grade12_videos(school_id);
CREATE INDEX idx_grade12_documents_school_id ON public.grade12_documents(school_id);

-- إنشاء triggers للتحديث التلقائي للتواريخ
CREATE TRIGGER update_grade10_videos_updated_at
BEFORE UPDATE ON public.grade10_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade10_documents_updated_at
BEFORE UPDATE ON public.grade10_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade12_videos_updated_at
BEFORE UPDATE ON public.grade12_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade12_documents_updated_at
BEFORE UPDATE ON public.grade12_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();