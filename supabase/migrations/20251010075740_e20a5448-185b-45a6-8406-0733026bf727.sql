-- ===================================
-- تحديث جدول teacher_exams لدعم multiple grades
-- ===================================

-- إضافة عمود جديد لدعم صفوف متعددة
ALTER TABLE public.teacher_exams
ADD COLUMN IF NOT EXISTS grade_levels TEXT[] DEFAULT '{}';

-- نقل البيانات من grade_level إلى grade_levels
UPDATE public.teacher_exams
SET grade_levels = ARRAY[grade_level]
WHERE grade_levels = '{}' OR grade_levels IS NULL;

-- إنشاء index جديد
CREATE INDEX IF NOT EXISTS idx_teacher_exams_grade_levels ON public.teacher_exams USING GIN(grade_levels);

-- تحديث RLS policies لدعم multiple grades
DROP POLICY IF EXISTS "Students can view published exams" ON public.teacher_exams;

CREATE POLICY "Students can view published exams"
ON public.teacher_exams FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM class_students cs
    JOIN students s ON s.id = cs.student_id
    JOIN classes c ON c.id = cs.class_id
    JOIN grade_levels gl ON gl.id = c.grade_level_id
    WHERE s.user_id = auth.uid()
    AND (
      cs.class_id = ANY(teacher_exams.target_class_ids)
      OR gl.code = ANY(teacher_exams.grade_levels)
      OR ARRAY_LENGTH(teacher_exams.target_class_ids, 1) IS NULL
    )
  )
);

-- إضافة comment للتوضيح
COMMENT ON COLUMN public.teacher_exams.grade_levels IS 'Array of grade levels (e.g., {10, 11}) - supports multiple grades per exam';
COMMENT ON COLUMN public.teacher_exams.grade_level IS 'Legacy column - kept for backward compatibility';
