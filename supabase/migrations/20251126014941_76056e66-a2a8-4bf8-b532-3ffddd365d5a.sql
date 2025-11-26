-- تعديل RLS Policy لجدول exams لتضمين الامتحانات المنتهية (ended)

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Students can view their available exams" ON public.exams;

-- إنشاء سياسة جديدة تتضمن ended
CREATE POLICY "Students can view their available exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
  status = ANY (ARRAY['scheduled'::exam_status, 'active'::exam_status, 'ended'::exam_status])
  AND (
    -- التحقق من target_classes
    (target_classes IS NOT NULL AND array_length(target_classes, 1) > 0 AND
      EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.class_students cs ON cs.student_id = s.id
        WHERE s.user_id = auth.uid()
        AND cs.class_id = ANY(exams.target_classes)
      )
    )
    OR
    -- التحقق من grade_levels
    (
      (target_classes IS NULL OR array_length(target_classes, 1) IS NULL OR array_length(target_classes, 1) = 0) AND
      EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.class_students cs ON cs.student_id = s.id
        JOIN public.classes c ON c.id = cs.class_id
        JOIN public.grade_levels gl ON gl.id = c.grade_level_id
        WHERE s.user_id = auth.uid()
        AND (gl.code = ANY(exams.grade_levels) OR gl.label = ANY(exams.grade_levels))
      )
    )
  )
);