-- حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS public.whiteboards CASCADE;

-- إضافة بلاجن اللوح الرقمي
INSERT INTO public.plugins (
  name, name_ar, description, description_ar, category, icon, default_status
) VALUES (
  'Digital Whiteboard', 
  'اللوح الرقمي',
  'Interactive digital whiteboard for drawing, writing and teaching',
  'لوح رقمي تفاعلي للرسم والكتابة والشرح أثناء التدريس',
  'teaching_tools',
  'Palette',
  'enabled'::plugin_status
);

-- إنشاء جدول whiteboards لحفظ اللوحات
CREATE TABLE public.whiteboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'لوح جديد',
  canvas_data JSONB NOT NULL DEFAULT '{}',
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة RLS
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

-- سياسات RLS: المعلمون يمكنهم إدارة لوحاتهم فقط
CREATE POLICY "Teachers can view their own whiteboards"
ON public.whiteboards
FOR SELECT
USING (
  user_id = auth.uid() 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "Teachers can create their own whiteboards"
ON public.whiteboards
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND school_id = get_user_school_id()
  AND get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
);

CREATE POLICY "Teachers can update their own whiteboards"
ON public.whiteboards
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "Teachers can delete their own whiteboards"
ON public.whiteboards
FOR DELETE
USING (
  user_id = auth.uid()
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- إضافة trigger للـ updated_at
CREATE TRIGGER update_whiteboards_updated_at
BEFORE UPDATE ON public.whiteboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة indexes لتسريع الاستعلامات
CREATE INDEX idx_whiteboards_user_id ON public.whiteboards(user_id);
CREATE INDEX idx_whiteboards_school_id ON public.whiteboards(school_id);
CREATE INDEX idx_whiteboards_created_at ON public.whiteboards(created_at DESC);