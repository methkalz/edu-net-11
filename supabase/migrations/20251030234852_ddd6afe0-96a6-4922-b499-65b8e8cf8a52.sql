-- دالة للحصول على بيانات حضور الطلاب مع حسابات دقيقة من الخادم
CREATE OR REPLACE FUNCTION public.get_active_students_for_reports()
RETURNS TABLE (
  id uuid,
  student_id uuid,
  user_id uuid,
  school_id uuid,
  school_name text,
  full_name text,
  email text,
  username text,
  is_online boolean,
  last_seen_at timestamptz,
  current_page text,
  class_name text,
  grade_level text,
  is_online_now boolean,
  is_active_last_24h boolean,
  is_active_last_30d boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.student_id,
    sp.user_id,
    sp.school_id,
    COALESCE(sch.name, 'Unknown') as school_name,
    COALESCE(s.full_name, 'Unknown') as full_name,
    COALESCE(s.email, '') as email,
    COALESCE(s.username, '') as username,
    sp.is_online,
    sp.last_seen_at,
    sp.current_page,
    cn.name as class_name,
    gl.label as grade_level,
    -- حساب is_online_now: متصل الآن إذا is_online = true أو last_seen خلال آخر دقيقتين
    (sp.is_online OR (NOW() - sp.last_seen_at) < INTERVAL '2 minutes') as is_online_now,
    -- حساب is_active_last_24h: نشط خلال آخر 24 ساعة
    ((NOW() - sp.last_seen_at) < INTERVAL '24 hours') as is_active_last_24h,
    -- حساب is_active_last_30d: نشط خلال آخر 30 يوم
    ((NOW() - sp.last_seen_at) < INTERVAL '30 days') as is_active_last_30d
  FROM public.student_presence sp
  LEFT JOIN public.students s ON sp.student_id = s.id
  LEFT JOIN public.schools sch ON sp.school_id = sch.id
  LEFT JOIN public.class_students cs ON s.id = cs.student_id
  LEFT JOIN public.classes c ON cs.class_id = c.id
  LEFT JOIN public.class_names cn ON c.class_name_id = cn.id
  LEFT JOIN public.grade_levels gl ON c.grade_level_id = gl.id
  ORDER BY sp.last_seen_at DESC;
END;
$function$;