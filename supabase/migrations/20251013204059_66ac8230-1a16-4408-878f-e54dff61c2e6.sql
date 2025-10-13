-- حل مشكلة الأقسام غير الموجودة في الامتحانات

-- الخطوة 1: حذف الـ selected_sections القديمة من الامتحانات الموجودة
UPDATE public.exams
SET selected_sections = ARRAY[]::uuid[]
WHERE question_source_type = 'question_bank'
  AND (
    selected_sections IS NULL 
    OR NOT EXISTS (
      SELECT 1 
      FROM question_bank_sections qbs 
      WHERE qbs.id = ANY(selected_sections)
    )
  );

-- الخطوة 2: إضافة constraint للتحقق من وجود الأقسام
-- (سنضيف هذا في الكود بدلاً من constraint للمرونة)

-- الخطوة 3: تحديث أي امتحانات فارغة
UPDATE public.exams
SET status = 'draft'
WHERE question_source_type = 'question_bank'
  AND (
    selected_sections IS NULL 
    OR array_length(selected_sections, 1) IS NULL
    OR array_length(selected_sections, 1) = 0
  )
  AND status IN ('scheduled', 'active');