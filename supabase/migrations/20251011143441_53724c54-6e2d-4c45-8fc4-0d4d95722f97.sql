-- إضافة RLS policy للطلاب لقراءة teacher_classes
-- السماح للطلاب برؤية المعلمين المعينين لصفوفهم

CREATE POLICY "Students can view their class teachers"
ON public.teacher_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_students cs
    JOIN public.students s ON s.id = cs.student_id
    WHERE cs.class_id = teacher_classes.class_id
      AND s.user_id = auth.uid()
  )
);