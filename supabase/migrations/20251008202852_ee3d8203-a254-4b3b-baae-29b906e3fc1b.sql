-- إضافة حقل last_attempt_start_time لجدول teacher_exam_instances
ALTER TABLE public.teacher_exam_instances 
ADD COLUMN last_attempt_start_time TIMESTAMP WITH TIME ZONE;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.teacher_exam_instances.last_attempt_start_time IS 'آخر موعد يمكن للطالب البدء بمحاولة جديدة. بعد هذا الوقت، لا يمكن بدء محاولات جديدة (لكن يمكن إكمال المحاولات الجارية)';

-- إضافة index لتحسين الأداء عند البحث عن الاختبارات
CREATE INDEX idx_teacher_exam_instances_last_attempt_time 
ON public.teacher_exam_instances(last_attempt_start_time);