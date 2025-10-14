-- إنشاء جدول لحفظ الهيكل الهرمي للمجلدات
CREATE TABLE IF NOT EXISTS public.drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  folder_type TEXT NOT NULL CHECK (folder_type IN ('school', 'grade', 'student')),
  parent_folder_id UUID REFERENCES public.drive_folders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  grade_level TEXT,
  encrypted_folder_id TEXT NOT NULL,
  encrypted_folder_url TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, folder_type, student_id, grade_level)
);

-- إضافة فهارس للأداء
CREATE INDEX idx_drive_folders_school ON public.drive_folders(school_id);
CREATE INDEX idx_drive_folders_student ON public.drive_folders(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_drive_folders_type ON public.drive_folders(folder_type);

-- تحديث جدول google_documents لإضافة الحقول المشفرة
ALTER TABLE public.google_documents 
ADD COLUMN IF NOT EXISTS encrypted_doc_id TEXT,
ADD COLUMN IF NOT EXISTS encrypted_doc_url TEXT,
ADD COLUMN IF NOT EXISTS drive_folder_id UUID REFERENCES public.drive_folders(id) ON DELETE SET NULL;

-- تمكين RLS على الجدول الجديد
ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لـ drive_folders
CREATE POLICY "School members can view their school folders"
ON public.drive_folders FOR SELECT
USING (
  school_id = get_user_school_id() OR 
  get_user_role() = 'superadmin'::app_role
);

CREATE POLICY "School admins can manage folders"
ON public.drive_folders FOR ALL
USING (
  (school_id = get_user_school_id() AND 
   get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]))
);

CREATE POLICY "Students can view their own folder"
ON public.drive_folders FOR SELECT
USING (
  student_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = drive_folders.student_id 
    AND s.user_id = auth.uid()
  )
);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_drive_folders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_drive_folders_updated_at
BEFORE UPDATE ON public.drive_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_drive_folders_updated_at();