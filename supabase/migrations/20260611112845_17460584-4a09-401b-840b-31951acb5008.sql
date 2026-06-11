
-- 1) Helper function: teacher access scoped by class
CREATE OR REPLACE FUNCTION public.teacher_can_access_bagrut_attempt(p_attempt_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bagrut_attempts ba
    JOIN public.students s            ON s.user_id   = ba.student_id
    JOIN public.class_students cs     ON cs.student_id = s.id
    JOIN public.teacher_classes tc    ON tc.class_id   = cs.class_id
    WHERE ba.id = p_attempt_id
      AND tc.teacher_id = auth.uid()
      AND ba.student_id IS NOT NULL
      AND s.id IS NOT NULL
      AND cs.class_id IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.teacher_can_access_bagrut_attempt(uuid) TO authenticated;

-- 2) bagrut_attempts: replace the overly-permissive teacher policies
DROP POLICY IF EXISTS "Teachers can view student attempts from their school" ON public.bagrut_attempts;
DROP POLICY IF EXISTS "Teachers can grade attempts from their school"        ON public.bagrut_attempts;

-- Teachers: only attempts from students in their assigned classes
CREATE POLICY "Teachers can view attempts of their class students"
  ON public.bagrut_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'teacher'::app_role
        AND p.school_id = bagrut_attempts.school_id
    )
    AND public.teacher_can_access_bagrut_attempt(bagrut_attempts.id)
  );

CREATE POLICY "Teachers can grade attempts of their class students"
  ON public.bagrut_attempts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'teacher'::app_role
        AND p.school_id = bagrut_attempts.school_id
    )
    AND public.teacher_can_access_bagrut_attempt(bagrut_attempts.id)
  );

-- School admins: keep school-wide oversight
CREATE POLICY "School admins can view all school attempts"
  ON public.bagrut_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'school_admin'::app_role
        AND p.school_id = bagrut_attempts.school_id
    )
  );

CREATE POLICY "School admins can grade all school attempts"
  ON public.bagrut_attempts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'school_admin'::app_role
        AND p.school_id = bagrut_attempts.school_id
    )
  );

-- 3) bagrut_question_grades: same scoping for teachers
DROP POLICY IF EXISTS "Teachers can manage question grades from their school" ON public.bagrut_question_grades;

CREATE POLICY "Teachers can manage question grades of their class students"
  ON public.bagrut_question_grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.bagrut_attempts ba ON ba.id = bagrut_question_grades.attempt_id
      WHERE p.user_id = auth.uid()
        AND p.role = 'teacher'::app_role
        AND p.school_id = ba.school_id
    )
    AND public.teacher_can_access_bagrut_attempt(bagrut_question_grades.attempt_id)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.bagrut_attempts ba ON ba.id = bagrut_question_grades.attempt_id
      WHERE p.user_id = auth.uid()
        AND p.role = 'teacher'::app_role
        AND p.school_id = ba.school_id
    )
    AND public.teacher_can_access_bagrut_attempt(bagrut_question_grades.attempt_id)
  );

CREATE POLICY "School admins can manage school question grades"
  ON public.bagrut_question_grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.bagrut_attempts ba ON ba.id = bagrut_question_grades.attempt_id
      WHERE p.user_id = auth.uid()
        AND p.role = 'school_admin'::app_role
        AND p.school_id = ba.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.bagrut_attempts ba ON ba.id = bagrut_question_grades.attempt_id
      WHERE p.user_id = auth.uid()
        AND p.role = 'school_admin'::app_role
        AND p.school_id = ba.school_id
    )
  );
