-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS public.get_available_exams(uuid);

-- إعادة إنشاء الدالة مع الإصلاح الصحيح
CREATE OR REPLACE FUNCTION public.get_available_exams(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  duration_minutes integer,
  total_questions integer,
  total_points integer,
  passing_percentage integer,
  start_datetime timestamp with time zone,
  end_datetime timestamp with time zone,
  max_attempts integer,
  attempts_used bigint,
  attempts_remaining bigint,
  can_start boolean,
  shuffle_questions boolean,
  shuffle_choices boolean,
  created_by uuid,
  grade_levels text[],
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_grade text;
BEGIN
  -- الحصول على صف الطالب
  SELECT get_student_assigned_grade(p_student_id) INTO student_grade;
  
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.duration_minutes,
    e.total_questions,
    e.total_points,
    e.passing_percentage,
    e.start_datetime,
    e.end_datetime,
    e.max_attempts,
    COALESCE(COUNT(ea.id) FILTER (WHERE ea.status = 'submitted'), 0) as attempts_used,
    GREATEST(0, e.max_attempts - COALESCE(COUNT(ea.id) FILTER (WHERE ea.status = 'submitted'), 0)) as attempts_remaining,
    (
      (e.start_datetime IS NULL OR e.start_datetime <= now()) AND
      (e.end_datetime IS NULL OR e.end_datetime >= now()) AND
      COALESCE(COUNT(ea.id) FILTER (WHERE ea.status = 'submitted'), 0) < e.max_attempts
    ) as can_start,
    e.shuffle_questions,
    e.shuffle_choices,
    e.created_by,
    e.grade_levels,
    e.status::text
  FROM public.exams e
  LEFT JOIN public.students s ON s.user_id = p_student_id
  LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = s.id
  WHERE e.status = 'published'
    AND student_grade = ANY(e.grade_levels)
  GROUP BY e.id
  ORDER BY e.created_at DESC;
END;
$$;