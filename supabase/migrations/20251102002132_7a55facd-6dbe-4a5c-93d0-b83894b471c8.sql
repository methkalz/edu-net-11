-- التراجع عن التعديل الأخير وإعادة get_available_exams كما كانت
DROP FUNCTION IF EXISTS public.get_available_exams(uuid);

CREATE OR REPLACE FUNCTION public.get_available_exams(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_by UUID,
  school_id UUID,
  grade_levels TEXT[],
  target_classes UUID[],
  total_questions INTEGER,
  total_points INTEGER,
  passing_percentage INTEGER,
  duration_minutes INTEGER,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  max_attempts INTEGER,
  show_results_immediately BOOLEAN,
  shuffle_questions BOOLEAN,
  shuffle_choices BOOLEAN,
  allow_review BOOLEAN,
  status exam_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  attempts_used INTEGER,
  attempts_remaining INTEGER,
  can_start BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      (e.status = 'active' OR (e.status = 'scheduled' AND now() >= e.start_datetime))
      AND now() >= e.start_datetime 
      AND now() <= e.end_datetime
      AND COALESCE(COUNT(ea.id), 0) < e.max_attempts
    )::BOOLEAN as can_start
  FROM public.exams e
  LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = p_student_id
  WHERE e.status IN ('scheduled', 'active')
    AND (
      -- إذا كان target_classes محدد، نتحقق من انتماء الطالب للصف
      (e.target_classes IS NOT NULL AND array_length(e.target_classes, 1) > 0 AND
        EXISTS (
          SELECT 1 FROM public.students s
          JOIN public.class_students cs ON cs.student_id = s.id
          WHERE s.user_id = p_student_id
          AND cs.class_id = ANY(e.target_classes)
        )
      )
      OR
      -- وإلا نتحقق من مستوى الصف
      (
        (e.target_classes IS NULL OR array_length(e.target_classes, 1) IS NULL OR array_length(e.target_classes, 1) = 0) AND
        EXISTS (
          SELECT 1 FROM public.students s
          JOIN public.class_students cs ON cs.student_id = s.id
          JOIN public.classes c ON c.id = cs.class_id
          JOIN public.grade_levels gl ON gl.id = c.grade_level_id
          WHERE s.user_id = p_student_id
          AND (gl.code = ANY(e.grade_levels) OR gl.label = ANY(e.grade_levels))
        )
      )
    )
  GROUP BY e.id
  ORDER BY e.start_datetime ASC;
END;
$$;