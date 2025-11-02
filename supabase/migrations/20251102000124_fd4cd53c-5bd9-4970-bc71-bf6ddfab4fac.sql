-- إصلاح دالة get_available_exams لحساب المحاولات بشكل صحيح
DROP FUNCTION IF EXISTS public.get_available_exams(uuid);

CREATE OR REPLACE FUNCTION public.get_available_exams(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  duration_minutes integer,
  total_questions integer,
  total_points integer,
  passing_percentage integer,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  max_attempts integer,
  shuffle_questions boolean,
  shuffle_choices boolean,
  status text,
  can_start boolean,
  attempts_used integer,
  attempts_remaining integer,
  exam_status text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_grade text;
  v_student_internal_id uuid;
BEGIN
  -- الحصول على student_id الفعلي من user_id
  SELECT s.id, 
    CASE 
      WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
      WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'
      WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
      ELSE COALESCE(gl.code, '11')
    END
  INTO v_student_internal_id, v_student_grade
  FROM public.students s
  LEFT JOIN public.class_students cs ON cs.student_id = s.id
  LEFT JOIN public.classes c ON c.id = cs.class_id
  LEFT JOIN public.grade_levels gl ON gl.id = c.grade_level_id
  WHERE s.user_id = p_student_id
  LIMIT 1;
  
  -- إذا لم نجد الطالب، نرجع نتيجة فارغة
  IF v_student_internal_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.duration_minutes,
    e.total_questions,
    e.total_points,
    e.passing_percentage,
    e.start_date,
    e.end_date,
    e.max_attempts,
    e.shuffle_questions,
    e.shuffle_choices,
    e.status::text,
    -- تحديد إمكانية البدء بالامتحان
    CASE
      WHEN e.status != 'active' THEN false
      WHEN e.start_date IS NOT NULL AND e.start_date > now() THEN false
      WHEN e.end_date IS NOT NULL AND e.end_date < now() THEN false
      WHEN COUNT(ea.id) >= e.max_attempts THEN false
      ELSE true
    END as can_start,
    -- عدد المحاولات المستخدمة (الآن صحيح!)
    COALESCE(COUNT(ea.id) FILTER (WHERE ea.status = 'submitted'), 0)::integer as attempts_used,
    -- عدد المحاولات المتبقية
    GREATEST(0, e.max_attempts - COALESCE(COUNT(ea.id) FILTER (WHERE ea.status = 'submitted'), 0))::integer as attempts_remaining,
    -- حالة الامتحان بالنسبة للطالب
    CASE
      WHEN e.status != 'active' THEN 'inactive'
      WHEN e.start_date IS NOT NULL AND e.start_date > now() THEN 'upcoming'
      WHEN e.end_date IS NOT NULL AND e.end_date < now() THEN 'expired'
      WHEN COUNT(ea.id) >= e.max_attempts THEN 'completed'
      WHEN COUNT(ea.id) > 0 THEN 'in_progress'
      ELSE 'available'
    END::text as exam_status
  FROM public.exams e
  -- JOIN الصحيح: استخدام student_id الفعلي من جدول students
  LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = v_student_internal_id
  WHERE e.status = 'active'
    AND (e.target_grade_level = v_student_grade OR e.target_grade_level IS NULL)
  GROUP BY e.id
  ORDER BY 
    CASE 
      WHEN e.start_date IS NOT NULL AND e.start_date > now() THEN e.start_date
      ELSE e.created_at
    END DESC;
END;
$function$;