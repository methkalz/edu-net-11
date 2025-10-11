-- تعديل دالة توليد أسئلة الامتحان لاستخدام الربط الصحيح
CREATE OR REPLACE FUNCTION public.generate_exam_questions(
  p_exam_id UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_exam RECORD;
  v_questions JSONB := '[]'::JSONB;
  v_question RECORD;
  v_questions_array JSONB[];
  v_difficulty_counts JSONB;
  v_easy_count INTEGER;
  v_medium_count INTEGER;
  v_hard_count INTEGER;
  v_total_needed INTEGER;
  v_section_titles TEXT[];
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
  
  -- حساب عدد الأسئلة المطلوب من كل مستوى صعوبة
  v_total_needed := COALESCE(v_exam.questions_count, 10);
  v_difficulty_counts := v_exam.difficulty_distribution->'distribution';
  
  v_easy_count := CEIL(v_total_needed * (COALESCE((v_difficulty_counts->>'easy')::INTEGER, 40) / 100.0));
  v_medium_count := CEIL(v_total_needed * (COALESCE((v_difficulty_counts->>'medium')::INTEGER, 40) / 100.0));
  v_hard_count := v_total_needed - v_easy_count - v_medium_count;
  
  -- إذا كان نوع المصدر "specific_sections"
  IF v_exam.question_source_type = 'specific_sections' AND 
     v_exam.selected_sections IS NOT NULL AND 
     array_length(v_exam.selected_sections, 1) > 0 THEN
    
    -- جلب أسماء الأقسام من الـ IDs
    SELECT array_agg(title) INTO v_section_titles
    FROM public.question_bank_sections
    WHERE id = ANY(v_exam.selected_sections);
    
    -- جلب أسئلة سهلة
    FOR v_question IN (
      SELECT qb.*, 'bank' as source
      FROM public.question_bank qb
      WHERE qb.section_name = ANY(v_section_titles)
        AND qb.difficulty = 'easy'
        AND qb.is_active = true
      ORDER BY RANDOM()
      LIMIT v_easy_count
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
    
    -- جلب أسئلة متوسطة
    FOR v_question IN (
      SELECT qb.*, 'bank' as source
      FROM public.question_bank qb
      WHERE qb.section_name = ANY(v_section_titles)
        AND qb.difficulty = 'medium'
        AND qb.is_active = true
      ORDER BY RANDOM()
      LIMIT v_medium_count
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
    
    -- جلب أسئلة صعبة
    FOR v_question IN (
      SELECT qb.*, 'bank' as source
      FROM public.question_bank qb
      WHERE qb.section_name = ANY(v_section_titles)
        AND qb.difficulty = 'hard'
        AND qb.is_active = true
      ORDER BY RANDOM()
      LIMIT v_hard_count
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
  IF array_length(v_questions_array, 1) > 0 THEN
    v_questions := array_to_json(v_questions_array)::JSONB;
  END IF;
  
  RETURN jsonb_build_object(
    'exam', jsonb_build_object(
      'id', v_exam.id,
      'title', v_exam.title,
      'description', v_exam.description,
      'duration_minutes', v_exam.duration_minutes,
      'total_questions', COALESCE(array_length(v_questions_array, 1), 0),
      'total_points', v_exam.total_points,
      'passing_percentage', v_exam.passing_percentage,
      'shuffle_questions', v_exam.shuffle_questions,
      'shuffle_choices', v_exam.shuffle_choices
    ),
    'questions', COALESCE(v_questions, '[]'::JSONB)
  );
END;
$$;