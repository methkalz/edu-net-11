-- ==========================================
-- الخطوة 1: توحيد صيغ الإجابات في البيانات الموجودة
-- ==========================================

-- 1. تحديث أسئلة صح/خطأ في بنك الأسئلة (choice_1 → choice_true)
UPDATE question_bank 
SET correct_answer = 'choice_true'
WHERE question_type = 'true_false' 
  AND correct_answer = 'choice_1';

-- 2. تحديث أسئلة صح/خطأ في بنك الأسئلة (choice_2 → choice_false)
UPDATE question_bank 
SET correct_answer = 'choice_false'
WHERE question_type = 'true_false' 
  AND correct_answer = 'choice_2';

-- 3. تحديث أسئلة المعلمين (1 → choice_1)
UPDATE teacher_custom_questions 
SET correct_answer = 'choice_1'
WHERE question_type = 'multiple_choice' 
  AND correct_answer = '1';

-- 4. تحديث أي أسئلة صح/خطأ في أسئلة المعلمين أيضاً
UPDATE teacher_custom_questions 
SET correct_answer = 'choice_true'
WHERE question_type = 'true_false' 
  AND correct_answer = 'choice_1';

UPDATE teacher_custom_questions 
SET correct_answer = 'choice_false'
WHERE question_type = 'true_false' 
  AND correct_answer = 'choice_2';

-- ==========================================
-- الخطوة 2: تحديث دالة submit_exam_attempt لدعم جميع صيغ الإجابات
-- ==========================================

CREATE OR REPLACE FUNCTION submit_exam_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt exam_attempts%ROWTYPE;
  v_exam exams%ROWTYPE;
  v_questions_data jsonb;
  v_question jsonb;
  v_correct_count integer := 0;
  v_total_questions integer := 0;
  v_earned_points numeric := 0;
  v_total_points numeric := 0;
  v_detailed_results jsonb := '[]'::jsonb;
  v_student_answer text;
  v_correct_answer text;
  v_is_correct boolean;
  v_question_type text;
  v_normalized_student text;
  v_normalized_correct text;
BEGIN
  -- 1. جلب بيانات المحاولة والامتحان
  SELECT * INTO v_attempt FROM exam_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  SELECT * INTO v_exam FROM exams WHERE id = v_attempt.exam_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  v_questions_data := v_attempt.questions_data;
  v_total_questions := jsonb_array_length(v_questions_data);

  -- 2. التحقق من جميع الأسئلة وحساب العلامات
  FOR i IN 0..(v_total_questions - 1) LOOP
    v_question := v_questions_data->i;
    v_student_answer := COALESCE(p_answers->>i, '');
    v_correct_answer := COALESCE(v_question->>'correct_answer', '');
    v_question_type := COALESCE(v_question->>'question_type', 'multiple_choice');

    -- منطق المقارنة الموحد والشامل
    IF v_question_type = 'true_false' THEN
      -- توحيد جميع صيغ صح/خطأ المحتملة
      v_normalized_student := CASE 
        WHEN LOWER(TRIM(v_student_answer)) IN ('true', '1', 'صح', 'صحيح', 'choice_1', 'choice_true') THEN 'true'
        WHEN LOWER(TRIM(v_student_answer)) IN ('false', '0', 'خطأ', 'خاطئ', 'choice_2', 'choice_false') THEN 'false'
        ELSE LOWER(TRIM(v_student_answer))
      END;
      
      v_normalized_correct := CASE 
        WHEN LOWER(TRIM(v_correct_answer)) IN ('true', '1', 'صح', 'صحيح', 'choice_1', 'choice_true') THEN 'true'
        WHEN LOWER(TRIM(v_correct_answer)) IN ('false', '0', 'خطأ', 'خاطئ', 'choice_2', 'choice_false') THEN 'false'
        ELSE LOWER(TRIM(v_correct_answer))
      END;
      
      v_is_correct := (v_normalized_student = v_normalized_correct);
    ELSE
      -- مقارنة مباشرة للاختيار المتعدد (choice_1, choice_2, etc.)
      v_is_correct := (LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)));
    END IF;

    -- حساب النقاط (جميع الأسئلة = نقطة واحدة)
    IF v_is_correct THEN
      v_correct_count := v_correct_count + 1;
      v_earned_points := v_earned_points + 1;
    END IF;
    v_total_points := v_total_points + 1;

    -- إضافة النتيجة التفصيلية
    v_detailed_results := v_detailed_results || jsonb_build_object(
      'question_index', i,
      'question_text', v_question->>'question_text',
      'student_answer', v_student_answer,
      'correct_answer', v_correct_answer,
      'is_correct', v_is_correct,
      'points', CASE WHEN v_is_correct THEN 1 ELSE 0 END
    );
  END LOOP;

  -- 3. حساب النسبة المئوية
  DECLARE
    v_percentage numeric;
    v_passed boolean;
  BEGIN
    v_percentage := CASE 
      WHEN v_total_questions > 0 THEN 
        ROUND((v_correct_count::numeric / v_total_questions::numeric) * 100, 2)
      ELSE 0 
    END;
    
    v_passed := (v_percentage >= v_exam.passing_percentage);

    -- 4. تحديث المحاولة
    UPDATE exam_attempts
    SET 
      answers = p_answers,
      status = 'completed',
      submitted_at = NOW(),
      score = v_percentage,
      percentage = v_percentage,
      passed = v_passed,
      detailed_results = jsonb_build_object(
        'correct_count', v_correct_count,
        'total_questions', v_total_questions,
        'earned_points', v_earned_points,
        'total_points', v_total_points,
        'questions', v_detailed_results
      ),
      updated_at = NOW()
    WHERE id = p_attempt_id;

    -- 5. إرجاع النتائج
    RETURN jsonb_build_object(
      'success', true,
      'score', v_percentage,
      'percentage', v_percentage,
      'passed', v_passed,
      'correct_count', v_correct_count,
      'total_questions', v_total_questions,
      'earned_points', v_earned_points,
      'total_points', v_total_points
    );
  END;
END;
$$;