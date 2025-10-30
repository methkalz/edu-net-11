-- دالة لحساب الطلاب النشطين خلال آخر 30 يوم بناءً على تاريخ قاعدة البيانات
CREATE OR REPLACE FUNCTION public.count_active_students_last_30_days(p_school_id uuid DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF p_school_id IS NULL THEN
    RETURN (
      SELECT COUNT(DISTINCT user_id)
      FROM public.student_presence
      WHERE last_seen_at >= NOW() - INTERVAL '30 days'
    );
  ELSE
    RETURN (
      SELECT COUNT(DISTINCT user_id)
      FROM public.student_presence
      WHERE school_id = p_school_id
        AND last_seen_at >= NOW() - INTERVAL '30 days'
    );
  END IF;
END;
$$;