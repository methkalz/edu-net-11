-- إصلاح دالة generate_exam_questions لربط الأقسام بشكل صحيح
CREATE OR REPLACE FUNCTION public.generate_exam_questions(p_exam_id uuid, p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exam RECORD;
  v_questions JSONB := '[]'::JSONB;
  v_question RECORD;
  v_questions_array JSONB[];
  v_total_needed INTEGER;
  v_student_grade TEXT;
BEGIN
  -- جلب معلومات الامتحان
  SELECT * INTO v_exam
  FROM public.exams
  WHERE id = p_exam_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;
  
  -- إذا كانت الأسئلة موجودة بالفعل، نعيدها
  IF EXISTS (SELECT 1 FROM public.exam_questions WHERE exam_id = p_exam_id LIMIT 1) THEN
    RETURN (SELECT public.get_exam_with_questions(p_exam_id, p_student_id));
  END IF;
  
  -- جلب صف الطالب
  SELECT get_student_assigned_grade(p_student_id) INTO v_student_grade;
  
  -- حساب عدد الأسئلة المطلوب
  v_total_needed := COALESCE(v_exam.questions_count, v_exam.total_questions, 10);
  
  -- معالجة حسب نوع المصدر
  IF v_exam.question_source_type = 'question_bank' THEN
    -- جلب من بنك الأسئلة بناءً على الأقسام المحددة
    IF v_exam.selected_sections IS NULL OR array_length(v_exam.selected_sections, 1) IS NULL THEN
      RAISE EXCEPTION 'No sections selected for question_bank source';
    END IF;
    
    -- الربط الصحيح: استخدام section title بدلاً من ID
    FOR v_question IN (
      SELECT 
        qb.*,
        'bank' as source
      FROM public.question_bank qb
      JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
      WHERE qbs.id = ANY(v_exam.selected_sections)
        AND qb.grade_level = v_student_grade
        AND qb.is_active = true
      ORDER BY RANDOM()
      LIMIT v_total_needed
    ) LOOP
      v_questions_array := array_append(v_questions_array, 
        jsonb_build_object(
          'id', v_question.id,
          'question_text', v_question.question_text,
          'question_type', v_question.question_type::TEXT,
          'choices', v_question.choices,
          'points', v_question.points,
          'source', 'bank'
        )
      );
    END LOOP;
    
  ELSIF v_exam.question_source_type = 'my_questions' THEN
    -- جلب من أسئلة المعلم
    FOR v_question IN (
      SELECT 
        tcq.*,
        'teacher' as source
      FROM public.teacher_custom_questions tcq
      WHERE tcq.is_active = true
        AND (v_exam.selected_teacher_categories IS NULL 
             OR tcq.category = ANY(v_exam.selected_teacher_categories))
      ORDER BY RANDOM()
      LIMIT v_total_needed
    ) LOOP
      v_questions_array := array_append(v_questions_array, 
        jsonb_build_object(
          'id', v_question.id,
          'question_text', v_question.question_text,
          'question_type', v_question.question_type::TEXT,
          'choices', v_question.choices,
          'points', v_question.points,
          'source', 'teacher'
        )
      );
    END LOOP;
    
  ELSE
    -- الوضع الذكي (smart) - اختيار عشوائي من جميع الأسئلة
    FOR v_question IN (
      SELECT 
        qb.*,
        'bank' as source
      FROM public.question_bank qb
      WHERE qb.grade_level = v_student_grade
        AND qb.is_active = true
      ORDER BY RANDOM()
      LIMIT v_total_needed
    ) LOOP
      v_questions_array := array_append(v_questions_array, 
        jsonb_build_object(
          'id', v_question.id,
          'question_text', v_question.question_text,
          'question_type', v_question.question_type::TEXT,
          'choices', v_question.choices,
          'points', v_question.points,
          'source', 'bank'
        )
      );
    END LOOP;
  END IF;
  
  -- تحويل المصفوفة إلى JSONB
  IF v_questions_array IS NOT NULL THEN
    v_questions := array_to_json(v_questions_array)::jsonb;
  END IF;
  
  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'exam', jsonb_build_object(
      'id', v_exam.id,
      'title', v_exam.title,
      'description', v_exam.description,
      'duration_minutes', v_exam.duration_minutes,
      'total_questions', v_exam.total_questions,
      'total_points', v_exam.total_points,
      'passing_percentage', v_exam.passing_percentage,
      'shuffle_questions', v_exam.shuffle_questions,
      'shuffle_choices', v_exam.shuffle_choices,
      'max_attempts', v_exam.max_attempts
    ),
    'questions', COALESCE(v_questions, '[]'::JSONB)
  );
END;
$function$;

COMMENT ON FUNCTION public.generate_exam_questions IS 'توليد أسئلة الامتحان من المصدر المحدد مع الربط الصحيح للأقسام';