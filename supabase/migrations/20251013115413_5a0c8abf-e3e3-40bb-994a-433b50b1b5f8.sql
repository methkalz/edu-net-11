-- إصلاح جذري لدالة generate_exam_questions لاستخدام الأعداد المباشرة بدلاً من النسب المئوية

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
  v_source_type TEXT;
  v_distribution_mode TEXT;
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
  v_total_needed := COALESCE(v_exam.questions_count, v_exam.total_questions, 10);
  v_difficulty_counts := v_exam.difficulty_distribution->'distribution';
  v_distribution_mode := COALESCE(v_exam.difficulty_distribution->>'mode', 'balanced');
  
  -- استخدام الأعداد المباشرة من distribution بدلاً من حساب النسب
  -- هذا هو الحل الجذري: الأعداد مخزنة مباشرة، لا حاجة للحساب
  v_easy_count := COALESCE((v_difficulty_counts->>'easy')::INTEGER, 0);
  v_medium_count := COALESCE((v_difficulty_counts->>'medium')::INTEGER, 0);
  v_hard_count := COALESCE((v_difficulty_counts->>'hard')::INTEGER, 0);
  
  -- تحقق من المجموع - إذا لم يطابق العدد المطلوب، استخدم توزيع افتراضي
  IF (v_easy_count + v_medium_count + v_hard_count) != v_total_needed THEN
    -- توزيع افتراضي متوازن
    v_easy_count := FLOOR(v_total_needed * 0.4);
    v_medium_count := FLOOR(v_total_needed * 0.4);
    v_hard_count := v_total_needed - v_easy_count - v_medium_count;
  END IF;
  
  -- جلب صف الطالب
  SELECT get_student_assigned_grade(p_student_id) INTO v_student_grade;
  
  -- تحديد مصدر الأسئلة
  v_source_type := COALESCE(v_exam.question_source_type, 'random');
  
  -- ====== جلب الأسئلة حسب المصدر ======
  
  IF v_source_type = 'my_questions' THEN
    -- جلب أسئلة المعلم من التصنيفات المحددة
    
    -- أسئلة سهلة
    IF v_easy_count > 0 THEN
      FOR v_question IN (
        SELECT tcq.*, 'teacher' as source
        FROM public.teacher_custom_questions tcq
        WHERE tcq.is_active = true
          AND tcq.difficulty = 'easy'
          AND (
            v_exam.selected_teacher_categories IS NULL 
            OR tcq.category = ANY(v_exam.selected_teacher_categories)
          )
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
            'source', 'teacher'
          )
        );
      END LOOP;
    END IF;
    
    -- أسئلة متوسطة
    IF v_medium_count > 0 THEN
      FOR v_question IN (
        SELECT tcq.*, 'teacher' as source
        FROM public.teacher_custom_questions tcq
        WHERE tcq.is_active = true
          AND tcq.difficulty = 'medium'
          AND (
            v_exam.selected_teacher_categories IS NULL 
            OR tcq.category = ANY(v_exam.selected_teacher_categories)
          )
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
            'source', 'teacher'
          )
        );
      END LOOP;
    END IF;
    
    -- أسئلة صعبة
    IF v_hard_count > 0 THEN
      FOR v_question IN (
        SELECT tcq.*, 'teacher' as source
        FROM public.teacher_custom_questions tcq
        WHERE tcq.is_active = true
          AND tcq.difficulty = 'hard'
          AND (
            v_exam.selected_teacher_categories IS NULL 
            OR tcq.category = ANY(v_exam.selected_teacher_categories)
          )
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
            'source', 'teacher'
          )
        );
      END LOOP;
    END IF;
    
  ELSIF v_source_type = 'specific_sections' THEN
    -- جلب من أقسام محددة من بنك الأسئلة
    
    -- أسئلة سهلة
    IF v_easy_count > 0 THEN
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
        FROM public.question_bank qb
        JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
        WHERE qbs.grade_level = v_student_grade
          AND qb.difficulty = 'easy'
          AND qb.is_active = true
          AND (
            v_exam.selected_sections IS NULL 
            OR qb.id = ANY(v_exam.selected_sections)
            OR qbs.id = ANY(v_exam.selected_sections)
          )
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
    END IF;
    
    -- أسئلة متوسطة
    IF v_medium_count > 0 THEN
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
        FROM public.question_bank qb
        JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
        WHERE qbs.grade_level = v_student_grade
          AND qb.difficulty = 'medium'
          AND qb.is_active = true
          AND (
            v_exam.selected_sections IS NULL 
            OR qb.id = ANY(v_exam.selected_sections)
            OR qbs.id = ANY(v_exam.selected_sections)
          )
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
    END IF;
    
    -- أسئلة صعبة
    IF v_hard_count > 0 THEN
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
        FROM public.question_bank qb
        JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
        WHERE qbs.grade_level = v_student_grade
          AND qb.difficulty = 'hard'
          AND qb.is_active = true
          AND (
            v_exam.selected_sections IS NULL 
            OR qb.id = ANY(v_exam.selected_sections)
            OR qbs.id = ANY(v_exam.selected_sections)
          )
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
    
  ELSE
    -- random: جلب عشوائي من جميع الأقسام
    
    -- أسئلة سهلة
    IF v_easy_count > 0 THEN
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
        FROM public.question_bank qb
        JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
        WHERE qbs.grade_level = v_student_grade
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
    END IF;
    
    -- أسئلة متوسطة
    IF v_medium_count > 0 THEN
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
        FROM public.question_bank qb
        JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
        WHERE qbs.grade_level = v_student_grade
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
    END IF;
    
    -- أسئلة صعبة
    IF v_hard_count > 0 THEN
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
        FROM public.question_bank qb
        JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
        WHERE qbs.grade_level = v_student_grade
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
      'shuffle_choices', v_exam.shuffle_choices,
      'max_attempts', v_exam.max_attempts
    ),
    'questions', COALESCE(v_questions, '[]'::JSONB)
  );
END;
$function$;