-- إصلاح نهائي لاحتساب الإجابات الصحيحة
-- جلب correct_answer من الجداول الأصلية بدلاً من questions_data

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
  v_student_answer_text TEXT;
  v_choice JSONB;
  v_question_id UUID;
  v_source TEXT;
  v_question_type TEXT;
  v_choices JSONB;
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
  
  -- حساب الوقت المستغرق
  v_time_spent_seconds := EXTRACT(EPOCH FROM (now() - v_attempt.started_at))::INTEGER;
  
  -- فحص عدد الأسئلة في جدول exam_questions
  SELECT COUNT(*) INTO v_questions_from_table
  FROM public.exam_questions
  WHERE exam_id = v_attempt.exam_id;
  
  -- إذا كان جدول exam_questions فارغاً، استخدم questions_data
  IF v_questions_from_table = 0 THEN
    -- حساب النتيجة من questions_data مع جلب correct_answer من الجداول الأصلية
    FOR v_question IN
      SELECT 
        (elem->>'id')::uuid as question_id,
        COALESCE((elem->>'points')::numeric, 1) as points,
        elem->'choices' as choices,
        (elem->>'question_type')::text as question_type,
        (elem->>'source')::text as source
      FROM jsonb_array_elements(v_attempt.questions_data) as elem
    LOOP
      v_total_questions := v_total_questions + 1;
      v_question_points := v_question.points;
      v_total_points := v_total_points + v_question_points;
      v_question_id := v_question.question_id;
      v_source := v_question.source;
      v_question_type := v_question.question_type;
      v_choices := v_question.choices;
      
      -- الحصول على إجابة الطالب
      v_student_answer := v_attempt.answers->v_question_id::text->>'answer';
      
      -- إذا لم يجب الطالب
      IF v_student_answer IS NULL OR v_student_answer = '' THEN
        v_unanswered_count := v_unanswered_count + 1;
        CONTINUE;
      END IF;
      
      -- جلب الإجابة الصحيحة من الجداول الأصلية
      v_correct_answer := NULL;
      IF v_source = 'bank' THEN
        SELECT correct_answer INTO v_correct_answer
        FROM public.question_bank
        WHERE id = v_question_id;
      ELSE
        SELECT correct_answer INTO v_correct_answer
        FROM public.teacher_custom_questions
        WHERE id = v_question_id;
      END IF;
      
      -- التحقق من الإجابة
      v_is_correct := FALSE;
      
      IF v_question_type = 'multiple_choice' AND v_source = 'bank' THEN
        -- أسئلة multiple_choice من بنك الأسئلة: تحويل choice_id إلى text
        v_student_answer_text := NULL;
        FOR v_choice IN SELECT * FROM jsonb_array_elements(v_choices)
        LOOP
          -- مقارنة كنص (لأن JSONB يحول الأرقام إلى نص)
          IF (v_choice->>'id') = v_student_answer THEN
            v_student_answer_text := v_choice->>'text';
            EXIT;
          END IF;
        END LOOP;
        
        IF v_student_answer_text IS NOT NULL AND v_correct_answer IS NOT NULL THEN
          IF LOWER(TRIM(v_student_answer_text)) = LOWER(TRIM(v_correct_answer)) THEN
            v_is_correct := TRUE;
          END IF;
        END IF;
      ELSE
        -- المقارنة المباشرة لباقي الأنواع (true_false, أسئلة المعلم)
        IF v_correct_answer IS NOT NULL AND v_student_answer IS NOT NULL THEN
          IF LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)) THEN
            v_is_correct := TRUE;
          END IF;
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
    -- المسار العادي: جدول exam_questions موجود
    FOR v_question IN
      SELECT 
        COALESCE(eq.points_override, 
          CASE 
            WHEN eq.question_source = 'bank' THEN qb.points
            ELSE tcq.points
          END, 1
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
        eq.question_source as source
      FROM public.exam_questions eq
      LEFT JOIN public.question_bank qb ON eq.question_bank_id = qb.id AND eq.question_source = 'bank'
      LEFT JOIN public.teacher_custom_questions tcq ON eq.custom_question_id = tcq.id AND eq.question_source IN ('teacher', 'my_questions')
      WHERE eq.exam_id = v_attempt.exam_id
      ORDER BY eq.question_order
    LOOP
      v_total_questions := v_total_questions + 1;
      v_question_points := v_question.points;
      v_total_points := v_total_points + v_question_points;
      v_correct_answer := v_question.correct_answer;
      
      -- الحصول على إجابة الطالب
      v_student_answer := v_attempt.answers->v_question.question_id::text->>'answer';
      
      IF v_student_answer IS NULL OR v_student_answer = '' THEN
        v_unanswered_count := v_unanswered_count + 1;
        CONTINUE;
      END IF;
      
      -- التحقق من الإجابة
      v_is_correct := FALSE;
      
      IF v_question.question_type = 'multiple_choice' AND v_question.source = 'bank' THEN
        v_student_answer_text := NULL;
        FOR v_choice IN SELECT * FROM jsonb_array_elements(v_question.choices)
        LOOP
          IF (v_choice->>'id') = v_student_answer THEN
            v_student_answer_text := v_choice->>'text';
            EXIT;
          END IF;
        END LOOP;
        
        IF v_student_answer_text IS NOT NULL AND v_correct_answer IS NOT NULL THEN
          IF LOWER(TRIM(v_student_answer_text)) = LOWER(TRIM(v_correct_answer)) THEN
            v_is_correct := TRUE;
          END IF;
        END IF;
      ELSE
        IF v_correct_answer IS NOT NULL AND v_student_answer IS NOT NULL THEN
          IF LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)) THEN
            v_is_correct := TRUE;
          END IF;
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
  
  -- تحديث المحاولة
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
      WHERE exam_id = v_attempt.exam_id AND status = 'submitted'
    ),
    avg_time_spent = (
      SELECT AVG(time_spent_seconds)
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id AND status = 'submitted'
    ),
    pass_rate = (
      SELECT (COUNT(*) FILTER (WHERE passed = true)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100)
      FROM public.exam_attempts
      WHERE exam_id = v_attempt.exam_id AND status = 'submitted'
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