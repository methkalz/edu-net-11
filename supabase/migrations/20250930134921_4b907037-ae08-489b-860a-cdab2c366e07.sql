-- تحديث الـ function لإضافة search_path لتحسين الأمان
CREATE OR REPLACE FUNCTION validate_event_times()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;