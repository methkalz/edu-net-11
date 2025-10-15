-- إنشاء جداول لتحضيرات امتحان المشروع للصف الثاني عشر
-- نسخة مطابقة لنظام دروس الصف العاشر

-- جدول الأقسام
CREATE TABLE IF NOT EXISTS public.grade12_exam_prep_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول المواضيع
CREATE TABLE IF NOT EXISTS public.grade12_exam_prep_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.grade12_exam_prep_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الدروس
CREATE TABLE IF NOT EXISTS public.grade12_exam_prep_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.grade12_exam_prep_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الوسائط للدروس
CREATE TABLE IF NOT EXISTS public.grade12_exam_prep_lesson_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.grade12_exam_prep_lessons(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'video', 'document', 'image', 'link'
  file_path TEXT,
  file_name TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.grade12_exam_prep_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_exam_prep_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_exam_prep_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_exam_prep_lesson_media ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - السوبر آدمن فقط يمكنه التعديل
-- الأقسام
CREATE POLICY "Superadmin can manage exam prep sections"
ON public.grade12_exam_prep_sections
FOR ALL
TO authenticated
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "All authenticated users can view exam prep sections"
ON public.grade12_exam_prep_sections
FOR SELECT
TO authenticated
USING (true);

-- المواضيع
CREATE POLICY "Superadmin can manage exam prep topics"
ON public.grade12_exam_prep_topics
FOR ALL
TO authenticated
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "All authenticated users can view exam prep topics"
ON public.grade12_exam_prep_topics
FOR SELECT
TO authenticated
USING (true);

-- الدروس
CREATE POLICY "Superadmin can manage exam prep lessons"
ON public.grade12_exam_prep_lessons
FOR ALL
TO authenticated
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "All authenticated users can view active exam prep lessons"
ON public.grade12_exam_prep_lessons
FOR SELECT
TO authenticated
USING (is_active = true OR get_user_role() = 'superadmin'::app_role);

-- الوسائط
CREATE POLICY "Superadmin can manage exam prep media"
ON public.grade12_exam_prep_lesson_media
FOR ALL
TO authenticated
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "All authenticated users can view exam prep media"
ON public.grade12_exam_prep_lesson_media
FOR SELECT
TO authenticated
USING (true);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_grade12_exam_prep_topics_section_id ON public.grade12_exam_prep_topics(section_id);
CREATE INDEX idx_grade12_exam_prep_lessons_topic_id ON public.grade12_exam_prep_lessons(topic_id);
CREATE INDEX idx_grade12_exam_prep_lesson_media_lesson_id ON public.grade12_exam_prep_lesson_media(lesson_id);

-- Triggers لتحديث updated_at تلقائياً
CREATE TRIGGER update_grade12_exam_prep_sections_updated_at
  BEFORE UPDATE ON public.grade12_exam_prep_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade12_exam_prep_topics_updated_at
  BEFORE UPDATE ON public.grade12_exam_prep_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade12_exam_prep_lessons_updated_at
  BEFORE UPDATE ON public.grade12_exam_prep_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();