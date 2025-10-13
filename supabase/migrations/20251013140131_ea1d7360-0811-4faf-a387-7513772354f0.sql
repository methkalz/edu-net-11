-- تحديث دالة submit_exam_attempt لحساب time_spent_seconds تلقائياً
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
  v_unanswered_count INTEGER := 0;
  v_percentage NUMERIC;
  v_passed BOOLEAN;
  v_question RECORD;
  v_student_answer TEXT;
  v_correct_answer TEXT;
  v_question_points NUMERIC;
  v_detailed_results JSONB;
  v_total_questions INTEGER := 0;
  v_questions_from_table INTEGER := 0;
  v_is_correct BOOLEAN;
  v_time_spent_seconds INTEGER;
BEGIN
  -- جلب معلومات المحاولة والامتحان
  SELECT * INTO v_attempt
  FROM public.exam_attempts
  WHERE id = p_attempt_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam attempt not found';
  END IF;
  
  SELECT * INTO v_exam
  FROM public.exams
  WHERE id = v_attempt.exam_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;
  
  -- حساب الوقت المستغرق من started_at إلى now()
  v_time_spent_seconds := EXTRACT(EPOCH FROM (now() - v_attempt.started_at))::INTEGER;
  
  -- فحص عدد الأسئلة في جدول exam_questions
  SELECT COUNT(*) INTO v_questions_from_table
  FROM public.exam_questions
  WHERE exam_id = v_attempt.exam_id;
  
  -- إذا كان جدول exam_questions فارغاً، استخدم questions_data من المحاولة
  IF v_questions_from_table = 0 THEN
    -- حساب النتيجة من questions_data الموجودة في المحاولة
    FOR v_question IN
      SELECT 
        (elem->>'id')::uuid as question_id,
        COALESCE((elem->>'points')::numeric, 10) as points,
        elem->'choices' as choices,
        (elem->>'question_type')::text as question_type,
        (elem->>'source')::text as source
      FROM jsonb_array_elements(v_attempt.questions_data) as elem
    LOOP
      v_total_questions := v_total_questions + 1;
      v_question_points := COALESCE(v_question.points, 10);
      v_total_points := v_total_points + v_question_points;
      
      -- الحصول على إجابة الطالب (choice_id أو boolean)
      v_student_answer := v_attempt.answers->v_question.question_id::text->>'answer';
      
      -- جلب الإجابة الصحيحة من teacher_custom_questions أو question_bank
      IF v_question.source = 'teacher' OR v_question.source = 'my_questions' THEN
        SELECT correct_answer INTO v_correct_answer
        FROM public.teacher_custom_questions
        WHERE id = v_question.question_id;
      ELSE
        SELECT correct_answer INTO v_correct_answer
        FROM public.question_bank
        WHERE id = v_question.question_id;
      END IF;
      
      -- إذا لم يجب الطالب على السؤال
      IF v_student_answer IS NULL OR v_student_answer = '' THEN
        v_unanswered_count := v_unanswered_count + 1;
        CONTINUE;
      END IF;
      
      -- المقارنة المباشرة بين choice_id (بدون تحويل إلى نص الخيار)
      v_is_correct := FALSE;
      
      IF v_correct_answer IS NOT NULL AND v_student_answer IS NOT NULL THEN
        -- المقارنة المباشرة (case-insensitive)
        IF LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)) THEN
          v_is_correct := TRUE;
        END IF;
      END IF;
      
      IF v_is_correct THEN
        v_score := v_score + v_question_points;
        v_correct_count := v_correct_count + 1;
      ELSE
        v_incorrect_count := v_incorrect_count + 1;
      END IF;
    END LOOP;
    
  ELSE
    -- المسار العادي: حساب النتيجة من جدول exam_questions
    FOR v_question IN
      SELECT 
        eq.id as exam_question_id,
        COALESCE(eq.points_override, 
          CASE 
            WHEN eq.question_source = 'bank' THEN qb.points
            ELSE tcq.points
          END
        ) as points,
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.id
          ELSE tcq.id
        END as question_id,
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.correct_answer
          ELSE tcq.correct_answer
        END as correct_answer,
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.choices
          ELSE tcq.choices
        END as choices,
        CASE 
          WHEN eq.question_source = 'bank' THEN qb.question_type::text
          ELSE tcq.question_type::text
        END as question_type,
        eq.question_source
      FROM public.exam_questions eq
      LEFT JOIN public.question_bank qb ON eq.question_bank_id = qb.id AND eq.question_source = 'bank'
      LEFT JOIN public.teacher_custom_questions tcq ON eq.custom_question_id = tcq.id AND eq.question_source IN ('teacher', 'my_questions')
      WHERE eq.exam_id = v_attempt.exam_id
      ORDER BY eq.question_order
    LOOP
      v_total_questions := v_total_questions + 1;
      v_question_points := COALESCE(v_question.points, 10);
      v_total_points := v_total_points + v_question_points;
      
      -- الحصول على إجابة الطالب (choice_id أو boolean)
      v_student_answer := v_attempt.answers->v_question.question_id::text->>'answer';
      v_correct_answer := v_question.correct_answer;
      
      -- إذا لم يجب الطالب على السؤال
      IF v_student_answer IS NULL OR v_student_answer = '' THEN
        v_unanswered_count := v_unanswered_count + 1;
        CONTINUE;
      END IF;
      
      -- المقارنة المباشرة بين choice_id (بدون تحويل إلى نص الخيار)
      v_is_correct := FALSE;
      
      IF v_correct_answer IS NOT NULL AND v_student_answer IS NOT NULL THEN
        -- المقارنة المباشرة (case-insensitive)
        IF LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)) THEN
          v_is_correct := TRUE;
        END IF;
      END IF;
      
      IF v_is_correct THEN
        v_score := v_score + v_question_points;
        v_correct_count := v_correct_count + 1;
      ELSE
        v_incorrect_count := v_incorrect_count + 1;
      END IF;
    END LOOP;
  END IF;
  
  -- حساب النسبة المئوية
  IF v_total_points > 0 THEN
    v_percentage := ROUND((v_score / v_total_points) * 100, 2);
  ELSE
    v_percentage := 0;
  END IF;
  
  -- تحديد النجاح/الرسوب
  v_passed := v_percentage >= v_exam.passing_percentage;
  
  -- إنشاء النتائج التفصيلية
  v_detailed_results := jsonb_build_object(
    'correct_count', v_correct_count,
    'incorrect_count', v_incorrect_count,
    'unanswered_count', v_unanswered_count,
    'total_questions', v_total_questions,
    'total_points', v_total_points,
    'earned_points', v_score
  );
  
  -- تحديث المحاولة مع حفظ الوقت المستغرق
  UPDATE public.exam_attempts
  SET 
    status = 'submitted',
    submitted_at = now(),
    time_spent_seconds = v_time_spent_seconds,
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
      SELECT (COUNT(*) FILTER (WHERE passed = true)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100)
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id
      AND status = 'submitted'
    ),
    updated_at = now()
  WHERE exam_id = v_attempt.exam_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'total_points', v_total_points,
    'percentage', v_percentage,
    'passed', v_passed,
    'time_spent_seconds', v_time_spent_seconds,
    'detailed_results', v_detailed_results
  );
END;
$function$;