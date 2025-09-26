-- إنشاء جدول لتتبع آخر تواجد الطلاب
CREATE TABLE public.student_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  school_id UUID NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_page TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- تمكين RLS
ALTER TABLE public.student_presence ENABLE ROW LEVEL SECURITY;

-- سياسة للطلاب لتحديث حالتهم
CREATE POLICY "Students can update their own presence" 
ON public.student_presence 
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- سياسة للمعلمين لرؤية حالة طلاب مدرستهم
CREATE POLICY "Teachers can view student presence in their school" 
ON public.student_presence 
FOR SELECT
USING (
  school_id = get_user_school_id() AND 
  get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
);

-- دالة لتحديث آخر تواجد
CREATE OR REPLACE FUNCTION public.update_student_presence(
  p_student_id UUID,
  p_is_online BOOLEAN DEFAULT true,
  p_current_page TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_presence (
    student_id,
    user_id,
    school_id,
    is_online,
    last_seen_at,
    current_page
  )
  SELECT 
    s.id,
    s.user_id,
    s.school_id,
    p_is_online,
    now(),
    p_current_page
  FROM public.students s
  WHERE s.id = p_student_id
  ON CONFLICT (student_id) 
  DO UPDATE SET
    is_online = p_is_online,
    last_seen_at = now(),
    current_page = COALESCE(p_current_page, student_presence.current_page),
    updated_at = now();
END;
$$;

-- trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_student_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_presence_updated_at
  BEFORE UPDATE ON public.student_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_presence_updated_at();