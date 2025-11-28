-- ═══════════════════════════════════════════════════════════════
-- توحيد صيغة الإجابات في نظام الامتحانات
-- ═══════════════════════════════════════════════════════════════

-- 1. تحديث question_bank - الأسئلة ذات الصيغة الحرفية (a, b, c, d)
UPDATE question_bank
SET 
  choices = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', CASE elem->>'id'
          WHEN 'a' THEN 'choice_1' WHEN 'b' THEN 'choice_2'
          WHEN 'c' THEN 'choice_3' WHEN 'd' THEN 'choice_4'
          WHEN 'e' THEN 'choice_5' ELSE elem->>'id'
        END,
        'text', elem->>'text'
      )
    )
    FROM jsonb_array_elements(choices) AS elem
  ),
  correct_answer = CASE correct_answer
    WHEN 'a' THEN 'choice_1' WHEN 'b' THEN 'choice_2'
    WHEN 'c' THEN 'choice_3' WHEN 'd' THEN 'choice_4'
    WHEN 'e' THEN 'choice_5' ELSE correct_answer
  END
WHERE correct_answer IN ('a', 'b', 'c', 'd', 'e')
   OR choices::text LIKE '%"id":"a"%';

-- 2. تحديث question_bank - الأسئلة ذات الصيغة الرقمية (1, 2, 3, 4)
UPDATE question_bank
SET 
  choices = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', 'choice_' || (elem->>'id'),
        'text', elem->>'text'
      )
    )
    FROM jsonb_array_elements(choices) AS elem
  ),
  correct_answer = 'choice_' || correct_answer
WHERE correct_answer ~ '^[1-9]$'
  AND correct_answer NOT LIKE 'choice_%'
  AND choices IS NOT NULL;

-- 3. تحديث question_bank - أسئلة صح/خطأ بصيغة choice_1/choice_2
UPDATE question_bank
SET 
  choices = '[{"id": "choice_true", "text": "صح"}, {"id": "choice_false", "text": "خطأ"}]'::jsonb,
  correct_answer = CASE 
    WHEN correct_answer IN ('choice_1', 'choice_0') THEN 'choice_true'
    WHEN correct_answer IN ('choice_2') THEN 'choice_false'
    ELSE correct_answer
  END
WHERE question_type = 'true_false'
  AND correct_answer LIKE 'choice_%'
  AND correct_answer NOT IN ('choice_true', 'choice_false');

-- 4. تحديث question_bank - أسئلة صح/خطأ بصيغة true/false
UPDATE question_bank
SET 
  choices = '[{"id": "choice_true", "text": "صح"}, {"id": "choice_false", "text": "خطأ"}]'::jsonb,
  correct_answer = CASE 
    WHEN correct_answer = 'true' THEN 'choice_true'
    WHEN correct_answer = 'false' THEN 'choice_false'
    ELSE correct_answer
  END
WHERE question_type = 'true_false'
  AND correct_answer IN ('true', 'false');

-- 5. تحديث teacher_custom_questions - choice_0 إلى choice_1 للاختيار المتعدد
UPDATE teacher_custom_questions
SET 
  choices = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', CASE 
          WHEN elem->>'id' = 'choice_0' THEN 'choice_1'
          WHEN elem->>'id' = 'choice_1' THEN 'choice_2'
          WHEN elem->>'id' = 'choice_2' THEN 'choice_3'
          WHEN elem->>'id' = 'choice_3' THEN 'choice_4'
          WHEN elem->>'id' = 'choice_4' THEN 'choice_5'
          ELSE elem->>'id'
        END,
        'text', elem->>'text'
      )
    )
    FROM jsonb_array_elements(choices) AS elem
  ),
  correct_answer = CASE 
    WHEN correct_answer = 'choice_0' THEN 'choice_1'
    WHEN correct_answer = 'choice_1' THEN 'choice_2'
    WHEN correct_answer = 'choice_2' THEN 'choice_3'
    WHEN correct_answer = 'choice_3' THEN 'choice_4'
    WHEN correct_answer = 'choice_4' THEN 'choice_5'
    ELSE correct_answer
  END
WHERE question_type = 'multiple_choice'
  AND choices IS NOT NULL
  AND choices::text LIKE '%choice_0%';

-- 6. تحديث teacher_custom_questions - أسئلة صح/خطأ
UPDATE teacher_custom_questions
SET 
  choices = '[{"id": "choice_true", "text": "صح"}, {"id": "choice_false", "text": "خطأ"}]'::jsonb,
  correct_answer = CASE 
    WHEN correct_answer = 'true' THEN 'choice_true'
    WHEN correct_answer = 'false' THEN 'choice_false'
    WHEN correct_answer = 'choice_0' THEN 'choice_true'
    WHEN correct_answer = 'choice_1' THEN 'choice_false'
    ELSE correct_answer
  END
WHERE question_type = 'true_false';

-- 7. تبسيط دالة submit_exam_attempt - المقارنة المباشرة
CREATE OR REPLACE FUNCTION submit_exam_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt record;
  v_question jsonb;
  v_student_answer text;
  v_correct_answer text;
  v_is_correct boolean;
  v_correct_count integer := 0;
  v_total_questions integer := 0;
  v_percentage numeric;
  v_score numeric;
  v_passed boolean;
  v_detailed_results jsonb := '[]'::jsonb;
  v_question_result jsonb;
BEGIN
  -- جلب المحاولة والتحقق من صلاحيتها
  SELECT * INTO v_attempt
  FROM exam_attempts
  WHERE id = p_attempt_id
    AND student_id = auth.uid()
    AND status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'محاولة غير صالحة أو منتهية';
  END IF;

  -- معالجة كل سؤال
  FOR v_question IN SELECT * FROM jsonb_array_elements(v_attempt.questions_data)
  LOOP
    v_total_questions := v_total_questions + 1;
    v_student_answer := p_answers->>(v_question->>'id');
    v_correct_answer := v_question->>'correct_answer';

    -- المقارنة المباشرة البسيطة (بعد توحيد البيانات)
    IF LOWER(TRIM(v_student_answer)) = LOWER(TRIM(v_correct_answer)) THEN
      v_is_correct := TRUE;
      v_correct_count := v_correct_count + 1;
    ELSE
      v_is_correct := FALSE;
    END IF;

    -- حفظ النتيجة التفصيلية
    v_question_result := jsonb_build_object(
      'question_id', v_question->>'id',
      'student_answer', v_student_answer,
      'correct_answer', v_correct_answer,
      'is_correct', v_is_correct,
      'points', (v_question->>'points')::integer
    );
    v_detailed_results := v_detailed_results || v_question_result;
  END LOOP;

  -- حساب النسبة المئوية والعلامة
  v_percentage := ROUND((v_correct_count::numeric / v_total_questions::numeric) * 100, 2);
  v_score := v_percentage;

  -- تحديد النجاح/الرسوب
  SELECT passing_percentage INTO v_passed
  FROM exams
  WHERE id = v_attempt.exam_id;
  v_passed := (v_percentage >= COALESCE(v_passed, 50));

  -- تحديث المحاولة
  UPDATE exam_attempts
  SET 
    status = 'completed',
    submitted_at = NOW(),
    answers = p_answers,
    score = v_score,
    percentage = v_percentage,
    passed = v_passed,
    detailed_results = jsonb_build_object(
      'correct_count', v_correct_count,
      'total_questions', v_total_questions,
      'questions', v_detailed_results
    ),
    updated_at = NOW()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'percentage', v_percentage,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions,
    'passed', v_passed
  );
END;
$$;