-- دالة لحساب الوقت المقضي تلقائياً
CREATE OR REPLACE FUNCTION public.calculate_session_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- عند تحول الطالب من offline إلى online، بدء جلسة جديدة
  IF NEW.is_online = true AND (OLD.is_online = false OR OLD.is_online IS NULL) THEN
    NEW.session_start_at = now();
  
  -- عند تحول الطالب من online إلى offline، حساب الوقت وإضافته
  ELSIF NEW.is_online = false AND OLD.is_online = true THEN
    IF NEW.session_start_at IS NOT NULL THEN
      NEW.total_time_minutes = COALESCE(OLD.total_time_minutes, 0) + 
        EXTRACT(EPOCH FROM (now() - NEW.session_start_at)) / 60;
      NEW.session_start_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger
DROP TRIGGER IF EXISTS calculate_session_time_trigger ON public.student_presence;
CREATE TRIGGER calculate_session_time_trigger
BEFORE UPDATE ON public.student_presence
FOR EACH ROW
EXECUTE FUNCTION public.calculate_session_time();