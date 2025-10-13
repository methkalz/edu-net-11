-- الحل النهائي: تحديث قيد question_source_type بالترتيب الصحيح

-- الخطوة 1: حذف القيد القديم أولاً لإلغاء جميع القيود
ALTER TABLE public.exams 
DROP CONSTRAINT IF EXISTS exams_question_source_type_check;

-- الخطوة 2: تحديث جميع القيم القديمة إلى القيم الجديدة
UPDATE public.exams 
SET question_source_type = CASE 
  WHEN question_source_type = 'random' THEN 'smart'
  WHEN question_source_type = 'specific_sections' THEN 'question_bank'
  WHEN question_source_type = 'my_questions' THEN 'my_questions'
  ELSE question_source_type
END;

-- الخطوة 3: الآن ننشئ الـ constraint الجديد
ALTER TABLE public.exams 
ADD CONSTRAINT exams_question_source_type_check 
CHECK (question_source_type IN ('smart', 'question_bank', 'my_questions'));

-- الخطوة 4: إضافة تعليق توضيحي
COMMENT ON COLUMN public.exams.question_source_type IS 'مصدر الأسئلة: smart (ذكي - اختيار تلقائي), question_bank (بنك الأسئلة), my_questions (أسئلة المعلم)';