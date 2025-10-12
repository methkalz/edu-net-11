-- إصلاح دالة submit_exam_attempt لحساب النتائج بشكل صحيح
CREATE OR REPLACE FUNCTION public.submit_exam_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- حساب النتيجة لكل سؤال - قراءة correct_answer من question_bank مباشرة
  FOR v_question IN
    SELECT 
      (elem->>'id')::uuid as question_id,
      COALESCE((elem->>'points')::numeric, 10) as points,
      qb.correct_answer  -- قراءة الإجابة الصحيحة من question_bank
    FROM jsonb_array_elements(v_attempt.questions_data) as elem
    LEFT JOIN public.question_bank qb ON qb.id = (elem->>'id')::uuid
  LOOP
    v_question_points := v_question.points;
    v_total_points := v_total_points + v_question_points;
    
    -- الحصول على إجابة الطالب
    v_student_answer := v_attempt.answers->v_question.question_id::text->>'answer';
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
      SELECT (COUNT(*) FILTER (WHERE passed = true)::NUMERIC / COUNT(*)::NUMERIC * 100)
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id
      AND status = 'submitted'
    ),
    updated_at = now()
  WHERE exam_id = v_attempt.exam_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'percentage', v_percentage,
    'passed', v_passed,
    'detailed_results', v_detailed_results
  );
END;
$function$;