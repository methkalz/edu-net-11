-- 1. حذف السياسات التي تسبب infinite recursion
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own class enrollments" ON public.class_students;

-- 2. إنشاء دالة آمنة للتحقق من تسجيل الطالب في الصف
CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_class(p_user_id uuid, p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_students cs
    JOIN public.students s ON s.id = cs.student_id
    WHERE s.user_id = p_user_id
      AND cs.class_id = p_class_id
  );
$$;

-- 3. إنشاء دالة للتحقق من ملكية الطالب لسجل في class_students
CREATE OR REPLACE FUNCTION public.is_student_class_enrollment(p_user_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = p_student_id
      AND s.user_id = p_user_id
  );
$$;

-- 4. إنشاء سياسة جديدة على class_students تستخدم الدالة
CREATE POLICY "Students can view their own class enrollments"
ON public.class_students
FOR SELECT
TO authenticated
USING (
  public.is_student_class_enrollment(auth.uid(), student_id)
);

-- 5. إنشاء سياسة جديدة على classes تستخدم الدالة
CREATE POLICY "Students can view their enrolled classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  public.is_student_enrolled_in_class(auth.uid(), id)
);