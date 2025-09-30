-- إضافة حقل end_time لجدول calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS end_time time without time zone;

-- إضافة تعليق على الأعمدة الجديدة
COMMENT ON COLUMN public.calendar_events.end_time IS 'وقت نهاية الحدث (اختياري)';
COMMENT ON COLUMN public.calendar_events.end_date IS 'تاريخ نهاية الحدث (اختياري للأحداث متعددة الأيام)';
COMMENT ON COLUMN public.calendar_events.time IS 'وقت بداية الحدث (اختياري)';

-- إنشاء trigger للتحقق من صحة الأوقات
CREATE OR REPLACE FUNCTION validate_event_times()
RETURNS TRIGGER AS $$
BEGIN
  -- التحقق من أن وقت النهاية ليس قبل وقت البداية في نفس اليوم
  IF NEW.date IS NOT NULL AND NEW.end_date IS NULL AND NEW.time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    IF NEW.end_time < NEW.time THEN
      RAISE EXCEPTION 'وقت النهاية يجب أن يكون بعد وقت البداية';
    END IF;
  END IF;
  
  -- التحقق من أن تاريخ النهاية ليس قبل تاريخ البداية
  IF NEW.end_date IS NOT NULL AND NEW.date IS NOT NULL THEN
    IF NEW.end_date < NEW.date THEN
      RAISE EXCEPTION 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ربط الـ trigger بالجدول
DROP TRIGGER IF EXISTS validate_event_times_trigger ON public.calendar_events;
CREATE TRIGGER validate_event_times_trigger
BEFORE INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION validate_event_times();