-- إضافة حقل تاريخ النهاية لجدول الأحداث
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS end_date date;

-- تحديث الأحداث الموجودة لتكون end_date نفس date إذا كانت NULL
UPDATE public.calendar_events 
SET end_date = date 
WHERE end_date IS NULL;

-- إضافة قيد للتأكد من أن تاريخ النهاية لا يأتي قبل تاريخ البداية
ALTER TABLE public.calendar_events 
ADD CONSTRAINT check_end_date_after_start_date 
CHECK (end_date >= date);

-- إضافة فهرس لتحسين استعلامات البحث بالفترات الزمنية
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range 
ON public.calendar_events(school_id, date, end_date) 
WHERE is_active = true;

-- إضافة تعليق للحقل الجديد
COMMENT ON COLUMN public.calendar_events.end_date IS 'تاريخ انتهاء الحدث - يمكن أن يكون نفس تاريخ البداية للأحداث ذات اليوم الواحد';