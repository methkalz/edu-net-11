-- تحديث دالة generate_exam_questions لدعم مصادر الأسئلة المتعددة
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
  v_difficulty_counts JSONB;
  v_easy_count INTEGER;
  v_medium_count INTEGER;
  v_hard_count INTEGER;
  v_total_needed INTEGER;
  v_student_grade TEXT;
  v_sources JSONB;
  v_source TEXT;
  v_source_count INTEGER;
  v_distribution JSONB;
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
  
  -- جلب مصادر الأسئلة والتوزيع
  v_sources := COALESCE(v_exam.question_sources, '["random"]'::jsonb);
  v_distribution := COALESCE(v_exam.source_distribution, '{}'::jsonb);
  
  -- حساب عدد الأسئلة المطلوب من كل مستوى صعوبة
  v_total_needed := COALESCE(v_exam.questions_count, v_exam.total_questions, 10);
  v_difficulty_counts := v_exam.difficulty_distribution->'distribution';
  
  v_easy_count := COALESCE((v_difficulty_counts->>'easy')::INTEGER, 0);
  v_medium_count := COALESCE((v_difficulty_counts->>'medium')::INTEGER, 0);
  v_hard_count := COALESCE((v_difficulty_counts->>'hard')::INTEGER, 0);
  
  -- تحقق من المجموع
  IF (v_easy_count + v_medium_count + v_hard_count) != v_total_needed THEN
    v_easy_count := FLOOR(v_total_needed * 0.4);
    v_medium_count := FLOOR(v_total_needed * 0.4);
    v_hard_count := v_total_needed - v_easy_count - v_medium_count;
  END IF;
  
  -- معالجة كل مصدر من المصادر
  FOR v_source IN SELECT jsonb_array_elements_text(v_sources)
  LOOP
    -- الحصول على عدد الأسئلة من هذا المصدر
    v_source_count := COALESCE((v_distribution->>v_source)::INTEGER, 0);
    
    IF v_source_count > 0 THEN
      -- حساب التوزيع النسبي لهذا المصدر
      DECLARE
        v_source_easy INTEGER := FLOOR(v_source_count * (v_easy_count::NUMERIC / v_total_needed));
        v_source_medium INTEGER := FLOOR(v_source_count * (v_medium_count::NUMERIC / v_total_needed));
        v_source_hard INTEGER;
      BEGIN
        v_source_hard := v_source_count - v_source_easy - v_source_medium;
        
        -- جلب الأسئلة حسب المصدر
        IF v_source = 'my_questions' THEN
          -- جلب من أسئلة المعلم
          FOR v_question IN (
            SELECT tcq.*, 'teacher' as source, tcq.difficulty
            FROM public.teacher_custom_questions tcq
            WHERE tcq.is_active = true
              AND (v_exam.selected_teacher_categories IS NULL OR tcq.category = ANY(v_exam.selected_teacher_categories))
            ORDER BY RANDOM()
            LIMIT v_source_count
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
          
        ELSIF v_source = 'specific_sections' THEN
          -- جلب من أقسام محددة
          FOR v_question IN (
            SELECT qb.*, 'bank' as source
            FROM public.question_bank qb
            JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
            WHERE qbs.grade_level = v_student_grade
              AND qb.is_active = true
              AND (v_exam.selected_sections IS NULL OR qb.id = ANY(v_exam.selected_sections) OR qbs.id = ANY(v_exam.selected_sections))
            ORDER BY RANDOM()
            LIMIT v_source_count
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
          
        ELSE -- random
          -- جلب عشوائي
          FOR v_question IN (
            SELECT qb.*, 'bank' as source
            FROM public.question_bank qb
            JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
            WHERE qbs.grade_level = v_student_grade
              AND qb.is_active = true
            ORDER BY RANDOM()
            LIMIT v_source_count
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
      END;
    END IF;
  END LOOP;
  
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
      'shuffle_choices', v_exam.shuffle_choices,
      'max_attempts', v_exam.max_attempts
    ),
    'questions', COALESCE(v_questions, '[]'::JSONB)
  );
END;
$function$;