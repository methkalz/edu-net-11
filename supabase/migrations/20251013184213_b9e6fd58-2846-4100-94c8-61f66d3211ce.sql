-- إضافة دعم لمصادر أسئلة متعددة في الامتحانات

-- 1) إضافة عمود question_sources كـ jsonb array لدعم مصادر متعددة
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS question_sources jsonb DEFAULT '["random"]'::jsonb;

-- 2) إضافة عمود source_distribution لتحديد عدد الأسئلة من كل مصدر
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS source_distribution jsonb DEFAULT '{}'::jsonb;

-- 3) تحديث السجلات الموجودة: نقل question_source_type إلى question_sources
UPDATE public.exams 
SET question_sources = jsonb_build_array(COALESCE(question_source_type, 'random'))
WHERE question_sources = '["random"]'::jsonb;

-- 4) إضافة تعليق توضيحي
COMMENT ON COLUMN public.exams.question_sources IS 'مصادر الأسئلة المختارة (يمكن أن يكون أكثر من مصدر): ["random", "specific_sections", "my_questions"]';
COMMENT ON COLUMN public.exams.source_distribution IS 'توزيع عدد الأسئلة من كل مصدر: {"my_questions": 5, "specific_sections": 5, "random": 0}';