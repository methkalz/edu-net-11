-- حذف القيد القديم
ALTER TABLE public.exams 
DROP CONSTRAINT IF EXISTS exams_question_source_type_check;

-- إنشاء قيد جديد يشمل القيم الثلاث
ALTER TABLE public.exams 
ADD CONSTRAINT exams_question_source_type_check 
CHECK (question_source_type = ANY (ARRAY['random'::text, 'specific_sections'::text, 'my_questions'::text]));

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.exams.question_source_type IS 'مصدر الأسئلة: random (عشوائي), specific_sections (أقسام محددة), my_questions (أسئلة المعلم)';