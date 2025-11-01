-- إصلاح دالة get_available_exams لدعم target_classes
CREATE OR REPLACE FUNCTION public.get_available_exams(p_student_id uuid)
 RETURNS TABLE(
   id uuid, 
   title text, 
   description text, 
   created_by uuid, 
   school_id uuid, 
   grade_levels text[], 
   target_classes uuid[], 
   total_questions integer, 
   total_points integer, 
   passing_percentage integer, 
   duration_minutes integer, 
   start_datetime timestamp with time zone, 
   end_datetime timestamp with time zone, 
   max_attempts integer, 
   show_results_immediately boolean, 
   shuffle_questions boolean, 
   shuffle_choices boolean, 
   allow_review boolean, 
   status exam_status, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   attempts_used integer, 
   attempts_remaining integer, 
   can_start boolean
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.created_by,
    e.school_id,
    e.grade_levels,
    e.target_classes,
    e.total_questions,
    e.total_points,
    e.passing_percentage,
    e.duration_minutes,
    e.start_datetime,
    e.end_datetime,
    e.max_attempts,
    e.show_results_immediately,
    e.shuffle_questions,
    e.shuffle_choices,
    e.allow_review,
    e.status,
    e.created_at,
    e.updated_at,
    COALESCE(COUNT(ea.id), 0)::INTEGER as attempts_used,
    GREATEST(0, e.max_attempts - COALESCE(COUNT(ea.id), 0))::INTEGER as attempts_remaining,
    (
      -- الامتحان النشط أو المجدول الذي حان وقته
      (e.status = 'active' OR (e.status = 'scheduled' AND now() >= e.start_datetime))
      AND now() >= e.start_datetime 
      AND now() <= e.end_datetime
      AND COALESCE(COUNT(ea.id), 0) < e.max_attempts
    )::BOOLEAN as can_start
  FROM public.exams e
  LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = p_student_id
  WHERE e.status IN ('scheduled', 'active')
    AND (
      -- الحالة 1: اختيار كل الصف (grade_levels غير فارغ)
      (
        COALESCE(array_length(e.grade_levels, 1), 0) > 0
        AND EXISTS (
          SELECT 1 FROM public.students s
          JOIN public.class_students cs ON cs.student_id = s.id
          JOIN public.classes c ON c.id = cs.class_id
          JOIN public.grade_levels gl ON gl.id = c.grade_level_id
          WHERE s.user_id = p_student_id
          AND (gl.code = ANY(e.grade_levels) OR gl.label = ANY(e.grade_levels))
        )
      )
      -- الحالة 2: اختيار صفوف محددة (target_classes غير فارغ)
      OR (
        COALESCE(array_length(e.target_classes, 1), 0) > 0
        AND EXISTS (
          SELECT 1 FROM public.students s
          JOIN public.class_students cs ON cs.student_id = s.id
          WHERE s.user_id = p_student_id
          AND cs.class_id = ANY(e.target_classes)
        )
      )
    )
  GROUP BY e.id
  ORDER BY e.start_datetime ASC;
END;
$function$;