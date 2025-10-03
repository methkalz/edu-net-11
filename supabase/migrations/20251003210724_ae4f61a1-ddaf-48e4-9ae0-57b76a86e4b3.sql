-- إنشاء جدول google_documents لتخزين معلومات مستندات Google Drive
CREATE TABLE IF NOT EXISTS public.google_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  doc_google_id TEXT NOT NULL UNIQUE,
  doc_url TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_google_documents_owner_id ON public.google_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_google_documents_school_id ON public.google_documents(school_id);

-- تفعيل RLS
ALTER TABLE public.google_documents ENABLE ROW LEVEL SECURITY;

-- سياسة للطلاب: يمكنهم رؤية وإنشاء مستنداتهم فقط
CREATE POLICY "Students can view their own documents"
ON public.google_documents
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Students can create their own documents"
ON public.google_documents
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- سياسة للمعلمين: يمكنهم رؤية مستندات طلابهم فقط
CREATE POLICY "Teachers can view their students documents"
ON public.google_documents
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'teacher'::app_role
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.class_students cs ON cs.student_id = s.id
    JOIN public.teacher_classes tc ON tc.class_id = cs.class_id
    WHERE s.user_id = google_documents.owner_id
      AND tc.teacher_id = auth.uid()
      AND s.school_id = google_documents.school_id
  )
);

-- سياسة للمدراء: يمكنهم رؤية كل مستندات مدرستهم
CREATE POLICY "School admins can view all school documents"
ON public.google_documents
FOR SELECT
TO authenticated
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- دالة لجلب مستندات الطلاب للمعلم
CREATE OR REPLACE FUNCTION public.get_teacher_student_documents(teacher_id_param UUID)
RETURNS TABLE (
  document_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  doc_url TEXT,
  doc_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gd.id AS document_id,
    s.user_id AS student_id,
    s.full_name AS student_name,
    s.email AS student_email,
    gd.doc_url,
    gd.title AS doc_title,
    gd.created_at,
    gd.last_accessed_at
  FROM
    public.google_documents gd
  JOIN
    public.students s ON gd.owner_id = s.user_id
  JOIN
    public.class_students cs ON s.id = cs.student_id
  JOIN
    public.teacher_classes tc ON cs.class_id = tc.class_id
  WHERE
    tc.teacher_id = teacher_id_param
    AND s.school_id = gd.school_id
  ORDER BY gd.created_at DESC;
END;
$$;

-- trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_google_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_google_documents_updated_at
BEFORE UPDATE ON public.google_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_google_documents_updated_at();