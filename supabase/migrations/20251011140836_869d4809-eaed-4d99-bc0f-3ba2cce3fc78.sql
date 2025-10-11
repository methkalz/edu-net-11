-- المرحلة 1: تنظيف البيانات - إزالة NULL من grade_levels
UPDATE teacher_exams
SET grade_levels = ARRAY_REMOVE(grade_levels, NULL)
WHERE grade_levels @> ARRAY[NULL]::text[];

-- المرحلة 2: تحسين RLS Policy للطلاب
DROP POLICY IF EXISTS "Students can view published exams" ON teacher_exams;

CREATE POLICY "Students can view published exams"
ON teacher_exams
FOR SELECT
TO authenticated
USING (
  status = 'published' 
  AND is_active = true
  AND grade_levels IS NOT NULL
  AND array_length(grade_levels, 1) > 0
  AND NOT (grade_levels @> ARRAY[NULL]::text[])
  AND EXISTS (
    SELECT 1
    FROM students s
    JOIN class_students cs ON cs.student_id = s.id
    JOIN classes c ON c.id = cs.class_id
    JOIN grade_levels gl ON gl.id = c.grade_level_id
    WHERE s.user_id = auth.uid()
      AND gl.code = ANY(teacher_exams.grade_levels)
      AND c.id = ANY(teacher_exams.target_class_ids)
  )
);