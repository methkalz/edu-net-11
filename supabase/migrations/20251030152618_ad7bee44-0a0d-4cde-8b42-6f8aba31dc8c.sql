
-- 1. إضافة عمود المعلمين النشطين
ALTER TABLE public.daily_activity_stats 
ADD COLUMN IF NOT EXISTS total_active_teachers INTEGER DEFAULT 0;

-- 2. Materialized View لإحصائيات المدارس (بدون نقاط - نشاط فقط)
DROP MATERIALIZED VIEW IF EXISTS public.superadmin_school_stats CASCADE;

CREATE MATERIALIZED VIEW public.superadmin_school_stats AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  s.city,
  COALESCE(p.name_ar, 'بدون باقة') AS package_name,
  COUNT(DISTINCT st.id) AS total_students,
  COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END) AS total_teachers,
  COUNT(DISTINCT cl.id) AS total_classes,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END) > 0 
    THEN ROUND(COUNT(DISTINCT st.id)::numeric / COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END), 2)
    ELSE 0 
  END AS student_teacher_ratio,
  0 AS avg_student_points,
  0 AS total_points,
  now() AS last_refreshed
FROM public.schools s
LEFT JOIN public.school_packages sp ON s.id = sp.school_id AND sp.status = 'active'
LEFT JOIN public.packages p ON sp.package_id = p.id
LEFT JOIN public.students st ON s.id = st.school_id
LEFT JOIN public.profiles pr ON s.id = pr.school_id
LEFT JOIN public.classes cl ON s.id = cl.school_id
GROUP BY s.id, s.name, s.city, p.name_ar;

CREATE UNIQUE INDEX IF NOT EXISTS idx_superadmin_school_stats_school_id 
ON public.superadmin_school_stats(school_id);

-- 3. Function لحساب النشاط اليومي
CREATE OR REPLACE FUNCTION public.calculate_daily_stats_for_superadmin(
  p_school_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_students INTEGER;
  v_active_teachers INTEGER;
  v_avg_duration INTEGER;
  v_peak_hour INTEGER;
BEGIN
  SELECT COUNT(DISTINCT student_id) INTO v_active_students
  FROM public.student_activity_log
  WHERE school_id = p_school_id AND DATE(created_at) = p_date;

  SELECT COUNT(DISTINCT pr.user_id) INTO v_active_teachers
  FROM public.profiles pr
  WHERE pr.school_id = p_school_id AND pr.role = 'teacher'
    AND EXISTS (
      SELECT 1 FROM public.student_activity_log sal
      WHERE sal.school_id = p_school_id AND DATE(sal.created_at) = p_date
      LIMIT 1
    );

  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (logout_time - login_time)) / 60)::INTEGER, 0) INTO v_avg_duration
  FROM public.student_presence
  WHERE school_id = p_school_id AND DATE(login_time) = p_date AND logout_time IS NOT NULL;

  SELECT EXTRACT(HOUR FROM created_at)::INTEGER INTO v_peak_hour
  FROM public.student_activity_log
  WHERE school_id = p_school_id AND DATE(created_at) = p_date
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY COUNT(*) DESC LIMIT 1;

  INSERT INTO public.daily_activity_stats (
    school_id, date, total_active_students, total_active_teachers, 
    avg_session_duration, peak_hour, updated_at
  ) VALUES (
    p_school_id, p_date, COALESCE(v_active_students, 0), COALESCE(v_active_teachers, 0),
    COALESCE(v_avg_duration, 0), COALESCE(v_peak_hour, 0), now()
  )
  ON CONFLICT (school_id, date) DO UPDATE SET
    total_active_students = EXCLUDED.total_active_students,
    total_active_teachers = EXCLUDED.total_active_teachers,
    avg_session_duration = EXCLUDED.avg_session_duration,
    peak_hour = EXCLUDED.peak_hour,
    updated_at = now();
END;
$$;

-- 4. Function للإحصائيات العامة (بدون نقاط)
CREATE OR REPLACE FUNCTION public.get_superadmin_overview_stats()
RETURNS TABLE (
  total_schools BIGINT, total_students BIGINT, total_teachers BIGINT, 
  total_classes BIGINT, avg_student_teacher_ratio NUMERIC, total_points NUMERIC,
  schools_with_activity BIGINT, last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT s.id),
    COUNT(DISTINCT st.id),
    COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END),
    COUNT(DISTINCT cl.id),
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END) > 0 
      THEN ROUND(COUNT(DISTINCT st.id)::numeric / COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END), 2)
      ELSE 0 
    END,
    0::NUMERIC,
    (SELECT COUNT(DISTINCT school_id) FROM public.daily_activity_stats
     WHERE date >= CURRENT_DATE - INTERVAL '7 days' AND total_active_students > 0),
    now()
  FROM public.schools s
  LEFT JOIN public.students st ON s.id = st.school_id
  LEFT JOIN public.profiles pr ON s.id = pr.school_id
  LEFT JOIN public.classes cl ON s.id = cl.school_id;
END;
$$;

-- 5. Function لاتجاهات النشاط
CREATE OR REPLACE FUNCTION public.get_school_activity_trends(
  p_school_id UUID DEFAULT NULL, p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE, total_active_students INTEGER, total_active_teachers INTEGER,
  avg_session_duration INTEGER, peak_hour INTEGER, school_name TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT das.date, das.total_active_students, das.total_active_teachers,
    das.avg_session_duration, das.peak_hour, s.name
  FROM public.daily_activity_stats das
  JOIN public.schools s ON das.school_id = s.id
  WHERE (p_school_id IS NULL OR das.school_id = p_school_id)
    AND das.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  ORDER BY das.date DESC, s.name;
END;
$$;

-- 6. RLS
ALTER TABLE public.daily_activity_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "السوبر أدمن يمكنه قراءة جميع الإحصائيات" ON public.daily_activity_stats;
CREATE POLICY "السوبر أدمن يمكنه قراءة جميع الإحصائيات" ON public.daily_activity_stats
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin')
);

-- 7. الصلاحيات
GRANT SELECT ON public.superadmin_school_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_superadmin_overview_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_activity_trends TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_daily_stats_for_superadmin TO authenticated;

-- 8. تحديث
REFRESH MATERIALIZED VIEW public.superadmin_school_stats;
