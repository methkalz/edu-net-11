-- إنشاء جدول grade12_videos إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.grade12_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  source_type TEXT DEFAULT 'youtube',
  thumbnail_url TEXT,
  category TEXT DEFAULT 'general',
  grade_level TEXT DEFAULT '12',
  is_visible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  allowed_roles TEXT[] DEFAULT ARRAY['all'::TEXT],
  order_index INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_size INTEGER,
  owner_user_id UUID NOT NULL,
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.grade12_videos ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "All authenticated users can view grade 12 videos" ON public.grade12_videos;
DROP POLICY IF EXISTS "School admins can manage grade 12 videos" ON public.grade12_videos;

-- إنشاء سياسات جديدة تدعم المشرف العام
CREATE POLICY "All authenticated users can view grade 12 videos"
ON public.grade12_videos
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "School admins can manage grade 12 videos"
ON public.grade12_videos
FOR ALL
USING (
  get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]) 
  AND (
    (school_id = get_user_school_id()) 
    OR (get_user_role() = 'superadmin'::app_role)
    OR (school_id IS NULL AND get_user_role() = 'superadmin'::app_role)
  )
);

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_grade12_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_grade12_videos_updated_at ON public.grade12_videos;
CREATE TRIGGER update_grade12_videos_updated_at
  BEFORE UPDATE ON public.grade12_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_grade12_videos_updated_at();