-- إصلاح دالة get_exam_results لاستخدام total_points من detailed_results
DROP FUNCTION IF EXISTS public.get_exam_results(uuid);

CREATE OR REPLACE FUNCTION public.get_exam_results(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_total_points NUMERIC;
BEGIN
  -- حساب total_points من detailed_results إذا كان موجوداً، وإلا من جدول exams
  SELECT 
    COALESCE(
      (ea.detailed_results->>'total_points')::numeric,
      e.total_points::numeric
    )
  INTO v_total_points
  FROM public.exam_attempts ea
  JOIN public.exams e ON e.id = ea.exam_id
  WHERE ea.id = p_attempt_id;

  SELECT jsonb_build_object(
    'attempt_id', ea.id,
    'exam_title', e.title,
    'student_id', ea.student_id,
    'attempt_number', ea.attempt_number,
    'started_at', ea.started_at,
    'submitted_at', ea.submitted_at,
    'time_spent_seconds', ea.time_spent_seconds,
    'score', ea.score,
    'total_points', v_total_points,
    'percentage', ea.percentage,
    'passed', ea.passed,
    'passing_percentage', e.passing_percentage,
    'detailed_results', ea.detailed_results,
    'can_review', e.allow_review,
    'show_correct_answers', e.show_results_immediately,
    'show_results_immediately', e.show_results_immediately,
    'teacher_name', p.full_name
  )
  INTO v_result
  FROM public.exam_attempts ea
  JOIN public.exams e ON e.id = ea.exam_id
  LEFT JOIN public.profiles p ON p.user_id = e.created_by
  WHERE ea.id = p_attempt_id;
  
  RETURN v_result;
END;
$function$;