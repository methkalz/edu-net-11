-- إضافة حقول لتتبع جلسات الطلاب
ALTER TABLE public.student_presence
ADD COLUMN IF NOT EXISTS session_start_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER DEFAULT 0;

-- تحديث السجلات الحالية
UPDATE public.student_presence
SET session_start_at = created_at
WHERE session_start_at IS NULL AND is_online = true;