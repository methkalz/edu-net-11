-- تشديد سياسة إنشاء المحاولات: التأكد من أن الطالب لا ينشئ محاولة باسم طالب آخر
DROP POLICY IF EXISTS "Students can create their own attempts" ON public.bagrut_attempts;

CREATE POLICY "Students can create their own attempts"
ON public.bagrut_attempts
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bagrut_exam_publications p
    JOIN public.class_students cs ON cs.class_id = p.class_id
    JOIN public.students s ON s.id = cs.student_id
    WHERE p.id = bagrut_attempts.publication_id
      AND p.is_active = true
      AND s.user_id = auth.uid()
  )
);