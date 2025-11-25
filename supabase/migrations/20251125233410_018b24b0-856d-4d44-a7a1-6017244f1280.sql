-- تصحيح البيانات الموجودة: ملء target_classes للامتحانات التي لها grade_levels فقط
-- هذا يحل مشكلة ظهور امتحانات المعلمين لكل طلاب الصف بدلاً من صفوف المعلم المحددة فقط

UPDATE exams e
SET target_classes = (
  SELECT ARRAY_AGG(DISTINCT tc.class_id)
  FROM teacher_classes tc
  JOIN classes c ON c.id = tc.class_id
  JOIN grade_levels gl ON gl.id = c.grade_level_id
  WHERE tc.teacher_id = e.created_by
  AND gl.code = ANY(e.grade_levels)
)
WHERE (
  e.target_classes IS NULL 
  OR array_length(e.target_classes, 1) IS NULL 
  OR array_length(e.target_classes, 1) = 0
)
AND e.grade_levels IS NOT NULL 
AND array_length(e.grade_levels, 1) > 0
AND e.created_by IS NOT NULL;