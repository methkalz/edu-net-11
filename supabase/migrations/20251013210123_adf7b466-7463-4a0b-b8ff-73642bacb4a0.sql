-- إضافة حقل source_distribution لحفظ التوزيع الكامل للمصادر
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS source_distribution JSONB DEFAULT '[]'::jsonb;

-- تحديث الامتحانات القديمة لتحويل question_source_type إلى source_distribution
UPDATE public.exams
SET source_distribution = 
  CASE 
    WHEN question_source_type = 'question_bank' THEN 
      jsonb_build_array(
        jsonb_build_object(
          'type', 'question_bank',
          'enabled', true,
          'count', total_questions
        )
      )
    WHEN question_source_type = 'my_questions' THEN 
      jsonb_build_array(
        jsonb_build_object(
          'type', 'my_questions',
          'enabled', true,
          'count', total_questions
        )
      )
    WHEN question_source_type = 'smart' THEN 
      jsonb_build_array(
        jsonb_build_object(
          'type', 'smart',
          'enabled', true,
          'count', total_questions
        )
      )
    ELSE '[]'::jsonb
  END
WHERE source_distribution IS NULL OR source_distribution = '[]'::jsonb;

COMMENT ON COLUMN public.exams.source_distribution IS 'توزيع الأسئلة من مصادر متعددة بصيغة JSONB';