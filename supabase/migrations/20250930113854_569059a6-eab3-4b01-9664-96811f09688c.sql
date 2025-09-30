-- إصلاح دالة update_student_presence لحساب الوقت بشكل صحيح
CREATE OR REPLACE FUNCTION public.update_student_presence(
  p_student_id uuid, 
  p_is_online boolean DEFAULT true, 
  p_current_page text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_record RECORD;
  v_session_duration INTEGER;
BEGIN
  -- الحصول على السجل الحالي
  SELECT * INTO v_current_record
  FROM public.student_presence
  WHERE student_id = p_student_id;

  -- إذا كان السجل موجود
  IF FOUND THEN
    -- حساب مدة الجلسة عند التحول من online إلى offline
    IF v_current_record.is_online = true AND p_is_online = false THEN
      IF v_current_record.session_start_at IS NOT NULL THEN
        v_session_duration := EXTRACT(EPOCH FROM (now() - v_current_record.session_start_at)) / 60;
        
        UPDATE public.student_presence
        SET 
          is_online = false,
          last_seen_at = now(),
          current_page = COALESCE(p_current_page, current_page),
          total_time_minutes = COALESCE(total_time_minutes, 0) + v_session_duration,
          session_start_at = NULL,
          updated_at = now()
        WHERE student_id = p_student_id;
      ELSE
        -- فقط تحديث الحالة
        UPDATE public.student_presence
        SET 
          is_online = false,
          last_seen_at = now(),
          current_page = COALESCE(p_current_page, current_page),
          updated_at = now()
        WHERE student_id = p_student_id;
      END IF;
    
    -- عند التحول من offline إلى online
    ELSIF v_current_record.is_online = false AND p_is_online = true THEN
      UPDATE public.student_presence
      SET 
        is_online = true,
        last_seen_at = now(),
        current_page = COALESCE(p_current_page, current_page),
        session_start_at = now(),
        updated_at = now()
      WHERE student_id = p_student_id;
    
    -- إذا كان online ومازال online (heartbeat)
    ELSIF p_is_online = true THEN
      UPDATE public.student_presence
      SET 
        last_seen_at = now(),
        current_page = COALESCE(p_current_page, current_page),
        updated_at = now()
      WHERE student_id = p_student_id;
    
    -- أي حالة أخرى
    ELSE
      UPDATE public.student_presence
      SET 
        is_online = p_is_online,
        last_seen_at = now(),
        current_page = COALESCE(p_current_page, current_page),
        updated_at = now()
      WHERE student_id = p_student_id;
    END IF;
  
  -- إذا لم يكن السجل موجود، إنشاؤه
  ELSE
    INSERT INTO public.student_presence (
      student_id,
      user_id,
      school_id,
      is_online,
      last_seen_at,
      current_page,
      session_start_at,
      total_time_minutes
    )
    SELECT 
      s.id,
      s.user_id,
      s.school_id,
      p_is_online,
      now(),
      p_current_page,
      CASE WHEN p_is_online THEN now() ELSE NULL END,
      0
    FROM public.students s
    WHERE s.id = p_student_id;
  END IF;
END;
$function$;