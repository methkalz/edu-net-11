-- تحديث جدول exams لإضافة الحقول الجديدة للتحكم الذكي في الأسئلة

-- إضافة حقل عدد الأسئلة
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS questions_count INTEGER DEFAULT 10;

-- إضافة حقل توزيع الصعوبة (jsonb)
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS difficulty_distribution JSONB DEFAULT '{"mode": "balanced", "distribution": {"easy": 40, "medium": 40, "hard": 20}}'::jsonb;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.exams.difficulty_distribution IS 'توزيع ذكي لصعوبة الأسئلة: mode (balanced/easy_focused/hard_focused/custom) و distribution (نسب مئوية)';
COMMENT ON COLUMN public.exams.questions_count IS 'عدد الأسئلة المطلوبة في الامتحان';

-- تحديث السجلات الموجودة
UPDATE public.exams 
SET 
  questions_count = COALESCE(total_questions, 10),
  difficulty_distribution = '{"mode": "balanced", "distribution": {"easy": 40, "medium": 40, "hard": 20}}'::jsonb
WHERE difficulty_distribution IS NULL;