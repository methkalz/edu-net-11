-- المرحلة 3: Database Functions لنظام الامتحانات

-- دالة للحصول على الامتحانات المتاحة للطالب
CREATE OR REPLACE FUNCTION public.get_available_exams(p_student_id UUID)
RETURNS TABLE (
  exam_id UUID,
  title TEXT,
  description TEXT,
  grade_level TEXT,
  duration_minutes INTEGER,
  total_questions INTEGER,
  total_points INTEGER,
  passing_percentage INTEGER,
  max_attempts INTEGER,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  status exam_status,
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
    e.id as exam_id,
    e.title,
    e.description,
    UNNEST(e.grade_levels) as grade_level,
    e.duration_minutes,
    e.total_questions,
    e.total_points,
    e.passing_percentage,
    e.max_attempts,
    e.start_datetime,
    e.end_datetime,
    e.status,
    COALESCE(COUNT(ea.id), 0)::INTEGER as attempts_used,
    GREATEST(0, e.max_attempts - COALESCE(COUNT(ea.id), 0))::INTEGER as attempts_remaining,
    (
      e.status = 'active' 
      AND now() >= e.start_datetime 
      AND now() <= e.end_datetime
      AND COALESCE(COUNT(ea.id), 0) < e.max_attempts
    )::BOOLEAN as can_start
  FROM public.exams e
  LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = p_student_id
  WHERE e.status IN ('scheduled', 'active')
    AND EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.class_students cs ON cs.student_id = s.id
      JOIN public.classes c ON c.id = cs.class_id
      JOIN public.grade_levels gl ON gl.id = c.grade_level_id
      WHERE s.user_id = p_student_id
      AND (gl.code = ANY(e.grade_levels) OR gl.label = ANY(e.grade_levels))
    )
  GROUP BY e.id
  ORDER BY e.start_datetime ASC;
END;
$$;

-- دالة للحصول على الامتحان مع الأسئلة (بدون الإجابات الصحيحة للطلاب)
CREATE OR REPLACE FUNCTION public.get_exam_with_questions(
  p_exam_id UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam JSONB;
  v_questions JSONB;
BEGIN
  -- جلب معلومات الامتحان
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'duration_minutes', e.duration_minutes,
    'total_questions', e.total_questions,
    'total_points', e.total_points,
    'passing_percentage', e.passing_percentage,
    'shuffle_questions', e.shuffle_questions,
    'shuffle_choices', e.shuffle_choices
  )
  INTO v_exam
  FROM public.exams e
  WHERE e.id = p_exam_id;
  
  -- جلب الأسئلة (بدون الإجابات الصحيحة)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', eq.id,
      'question_order', eq.question_order,
      'points', COALESCE(eq.points_override, 
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.points
          ELSE tcq.points
        END
      ),
      'question_text', 
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.question_text
          ELSE tcq.question_text
        END,
      'question_type',
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.question_type::TEXT
          ELSE tcq.question_type::TEXT
        END,
      'choices',
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.choices
          ELSE tcq.choices
        END
    )
    ORDER BY eq.question_order
  )
  INTO v_questions
  FROM public.exam_questions eq
  LEFT JOIN public.question_bank qb ON eq.question_bank_id = qb.id
  LEFT JOIN public.teacher_custom_questions tcq ON eq.custom_question_id = tcq.id
  WHERE eq.exam_id = p_exam_id;
  
  RETURN jsonb_build_object(
    'exam', v_exam,
    'questions', COALESCE(v_questions, '[]'::jsonb)
  );
END;
$$;

-- دالة لحساب النتيجة وتحديث المحاولة
CREATE OR REPLACE FUNCTION public.submit_exam_attempt(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_exam RECORD;
  v_score NUMERIC := 0;
  v_total_points NUMERIC := 0;
  v_correct_count INTEGER := 0;
  v_incorrect_count INTEGER := 0;
  v_percentage NUMERIC;
  v_passed BOOLEAN;
  v_question RECORD;
  v_student_answer TEXT;
  v_correct_answer TEXT;
  v_question_points NUMERIC;
  v_detailed_results JSONB;
BEGIN
  -- جلب معلومات المحاولة والامتحان
  SELECT * INTO v_attempt
  FROM public.exam_attempts
  WHERE id = p_attempt_id;
  
  SELECT * INTO v_exam
  FROM public.exams
  WHERE id = v_attempt.exam_id;
  
  -- حساب النتيجة لكل سؤال
  FOR v_question IN
    SELECT 
      eq.id,
      eq.points_override,
      eq.question_source,
      CASE 
        WHEN eq.question_source = 'bank' THEN qb.correct_answer
        ELSE tcq.correct_answer
      END as correct_answer,
      CASE 
        WHEN eq.question_source = 'bank' THEN qb.points
        ELSE tcq.points
      END as default_points
    FROM public.exam_questions eq
    LEFT JOIN public.question_bank qb ON eq.question_bank_id = qb.id
    LEFT JOIN public.teacher_custom_questions tcq ON eq.custom_question_id = tcq.id
    WHERE eq.exam_id = v_attempt.exam_id
  LOOP
    v_question_points := COALESCE(v_question.points_override, v_question.default_points);
    v_total_points := v_total_points + v_question_points;
    
    -- الحصول على إجابة الطالب
    v_student_answer := v_attempt.answers->v_question.id::TEXT->>'answer';
    v_correct_answer := v_question.correct_answer;
    
    -- مقارنة الإجابات
    IF v_student_answer IS NOT NULL AND LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)) THEN
      v_score := v_score + v_question_points;
      v_correct_count := v_correct_count + 1;
    ELSE
      v_incorrect_count := v_incorrect_count + 1;
    END IF;
  END LOOP;
  
  -- حساب النسبة المئوية
  IF v_total_points > 0 THEN
    v_percentage := (v_score / v_total_points) * 100;
  ELSE
    v_percentage := 0;
  END IF;
  
  -- تحديد النجاح/الرسوب
  v_passed := v_percentage >= v_exam.passing_percentage;
  
  -- إنشاء النتائج التفصيلية
  v_detailed_results := jsonb_build_object(
    'correct_count', v_correct_count,
    'incorrect_count', v_incorrect_count,
    'total_questions', v_correct_count + v_incorrect_count
  );
  
  -- تحديث المحاولة
  UPDATE public.exam_attempts
  SET 
    status = 'submitted',
    submitted_at = now(),
    score = v_score,
    percentage = v_percentage,
    passed = v_passed,
    detailed_results = v_detailed_results,
    updated_at = now()
  WHERE id = p_attempt_id;
  
  -- تحديث التحليلات
  INSERT INTO public.exam_analytics (exam_id)
  VALUES (v_attempt.exam_id)
  ON CONFLICT (exam_id) DO NOTHING;
  
  UPDATE public.exam_analytics
  SET 
    total_attempts = total_attempts + 1,
    avg_score = (
      SELECT AVG(score)
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id
      AND status = 'submitted'
    ),
    avg_time_spent = (
      SELECT AVG(time_spent_seconds)
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id
      AND status = 'submitted'
    ),
    pass_rate = (
      SELECT (COUNT(*) FILTER (WHERE passed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id
      AND status = 'submitted'
    ),
    updated_at = now()
  WHERE exam_id = v_attempt.exam_id;
  
  RETURN jsonb_build_object(
    'score', v_score,
    'total_points', v_total_points,
    'percentage', v_percentage,
    'passed', v_passed,
    'details', v_detailed_results
  );
END;
$$;

-- دالة للحصول على نتائج المحاولة
CREATE OR REPLACE FUNCTION public.get_exam_results(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'attempt_id', ea.id,
    'exam_title', e.title,
    'student_id', ea.student_id,
    'attempt_number', ea.attempt_number,
    'started_at', ea.started_at,
    'submitted_at', ea.submitted_at,
    'time_spent_seconds', ea.time_spent_seconds,
    'score', ea.score,
    'total_points', e.total_points,
    'percentage', ea.percentage,
    'passed', ea.passed,
    'passing_percentage', e.passing_percentage,
    'detailed_results', ea.detailed_results,
    'can_review', e.allow_review,
    'show_correct_answers', e.show_results_immediately
  )
  INTO v_result
  FROM public.exam_attempts ea
  JOIN public.exams e ON e.id = ea.exam_id
  WHERE ea.id = p_attempt_id;
  
  RETURN v_result;
END;
$$;