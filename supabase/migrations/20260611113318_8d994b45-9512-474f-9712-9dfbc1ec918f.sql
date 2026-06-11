
-- Helper: check if current teacher can view a given student presence row by student user_id
CREATE OR REPLACE FUNCTION public.teacher_can_view_student_user(p_student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_classes tc
    JOIN public.class_students cs ON cs.class_id = tc.class_id
    JOIN public.students s ON s.id = cs.student_id
    WHERE tc.teacher_id = auth.uid()
      AND s.user_id = p_student_user_id
  );
$$;

-- =========================
-- student_presence
-- =========================
DROP POLICY IF EXISTS "Teachers can view student presence in their school" ON public.student_presence;
DROP POLICY IF EXISTS "Teachers can view presence of their students" ON public.student_presence;
DROP POLICY IF EXISTS "School admins can view all school presence" ON public.student_presence;

CREATE POLICY "Teachers can view presence of their students"
ON public.student_presence
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'teacher'::app_role
  AND school_id = get_user_school_id()
  AND public.teacher_can_view_student_user(user_id)
);

CREATE POLICY "School admins can view all school presence"
ON public.student_presence
FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id())
  OR get_user_role() = 'superadmin'::app_role
);

-- =========================
-- class_students
-- =========================
DROP POLICY IF EXISTS "School members can view class enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can view enrollments of their classes" ON public.class_students;
DROP POLICY IF EXISTS "School admins can view all class enrollments" ON public.class_students;

CREATE POLICY "Teachers can view enrollments of their classes"
ON public.class_students
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'teacher'::app_role
  AND public.is_teacher_assigned_to_class(auth.uid(), class_id)
);

CREATE POLICY "School admins can view all class enrollments"
ON public.class_students
FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'school_admin'::app_role
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_students.class_id
        AND c.school_id = get_user_school_id()
    ))
  OR get_user_role() = 'superadmin'::app_role
);
