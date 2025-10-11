-- إضافة سياسة للطلاب لرؤية تسجيلاتهم في class_students
CREATE POLICY "Students can view their own class enrollments"
ON public.class_students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.students s
    WHERE s.id = class_students.student_id 
      AND s.user_id = auth.uid()
  )
);

-- إضافة سياسة للطلاب لرؤية الصفوف المسجلين فيها
CREATE POLICY "Students can view their enrolled classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_students cs
    JOIN public.students s ON s.id = cs.student_id
    WHERE cs.class_id = classes.id
      AND s.user_id = auth.uid()
  )
);