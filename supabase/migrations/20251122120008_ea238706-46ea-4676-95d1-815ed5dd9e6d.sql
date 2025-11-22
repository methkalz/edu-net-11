-- تحديث دالة generate_exam_questions مع Smart Fallback
-- تضمن هذه الدالة أن الطالب يحصل على العدد الكامل من الأسئلة حتى لو كان مصدر معين لا يحتوي على أسئلة كافية

CREATE OR REPLACE FUNCTION public.generate_exam_questions(
  p_exam_id uuid,
  p_student_id uuid
) RETURNS jsonb
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
  v_source JSONB;
  v_needed_count INTEGER;
  v_fetched_count INTEGER;
  v_missing_count INTEGER := 0;
  v_warnings JSONB := '[]'::JSONB;
  v_used_question_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- جلب معلومات الامتحان
  SELECT * INTO v_exam FROM public.exams WHERE id = p_exam_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exam not found'; END IF;
  
  -- إذا كانت الأسئلة موجودة بالفعل، نعيدها
  IF EXISTS (SELECT 1 FROM public.exam_questions WHERE exam_id = p_exam_id LIMIT 1) THEN
    RETURN (SELECT public.get_exam_with_questions(p_exam_id, p_student_id));
  END IF;
  
  -- جلب صف الطالب
  SELECT get_student_assigned_grade(p_student_id) INTO v_student_grade;
  
  -- التحقق من وجود source_distribution
  IF v_exam.source_distribution IS NOT NULL 
     AND jsonb_array_length(v_exam.source_distribution) > 0 THEN
    
    -- ✅ المسار الجديد: توزيع متعدد المصادر مع Smart Fallback
    FOR v_source IN SELECT * FROM jsonb_array_elements(v_exam.source_distribution)
    LOOP
      IF (v_source->>'enabled')::boolean = true THEN
        v_needed_count := COALESCE((v_source->>'count')::integer, 0);
        v_fetched_count := 0;
        
        -- جلب من المصدر المحدد
        IF (v_source->>'type') = 'question_bank' THEN
          FOR v_question IN (
            SELECT qb.*, 'bank' as source
            FROM public.question_bank qb
            JOIN public.question_bank_sections qbs ON qbs.title = qb.section_name
            WHERE qbs.id = ANY(v_exam.selected_sections)
              AND qb.grade_level = v_student_grade
              AND qb.is_active = true
              AND NOT (qb.id = ANY(v_used_question_ids))
            ORDER BY RANDOM()
            LIMIT v_needed_count
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
            v_used_question_ids := array_append(v_used_question_ids, v_question.id);
            v_fetched_count := v_fetched_count + 1;
          END LOOP;
          
        ELSIF (v_source->>'type') = 'my_questions' THEN
          FOR v_question IN (
            SELECT tcq.*, 'teacher' as source
            FROM public.teacher_custom_questions tcq
            WHERE tcq.is_active = true
              AND tcq.teacher_id = v_exam.created_by
              AND (v_exam.selected_teacher_categories IS NULL 
                   OR tcq.category = ANY(v_exam.selected_teacher_categories))
              AND NOT (tcq.id = ANY(v_used_question_ids))
            ORDER BY RANDOM()
            LIMIT v_needed_count
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
            v_used_question_ids := array_append(v_used_question_ids, v_question.id);
            v_fetched_count := v_fetched_count + 1;
          END LOOP;
          
        ELSIF (v_source->>'type') = 'smart' THEN
          FOR v_question IN (
            SELECT qb.*, 'bank' as source
            FROM public.question_bank qb
            WHERE qb.grade_level = v_student_grade
              AND qb.is_active = true
              AND NOT (qb.id = ANY(v_used_question_ids))
            ORDER BY RANDOM()
            LIMIT v_needed_count
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
            v_used_question_ids := array_append(v_used_question_ids, v_question.id);
            v_fetched_count := v_fetched_count + 1;
          END LOOP;
        END IF;
        
        -- ✅ SMART FALLBACK: إذا لم نحصل على العدد المطلوب
        IF v_fetched_count < v_needed_count THEN
          v_missing_count := v_needed_count - v_fetched_count;
          
          -- إضافة warning
          v_warnings := v_warnings || jsonb_build_object(
            'source_type', v_source->>'type',
            'source_label', v_source->>'label',
            'requested', v_needed_count,
            'fetched', v_fetched_count,
            'missing', v_missing_count
          );
          
          -- Fallback: جلب الباقي من بنك الأسئلة
          FOR v_question IN (
            SELECT qb.*, 'bank_fallback' as source
            FROM public.question_bank qb
            WHERE qb.grade_level = v_student_grade
              AND qb.is_active = true
              AND NOT (qb.id = ANY(v_used_question_ids))
            ORDER BY RANDOM()
            LIMIT v_missing_count
          ) LOOP
            v_questions_array := array_append(v_questions_array, 
              jsonb_build_object(
                'id', v_question.id,
                'question_text', v_question.question_text,
                'question_type', v_question.question_type::TEXT,
                'choices', v_question.choices,
                'points', v_question.points,
                'source', 'bank',
                'fallback', true
              )
            );
            v_used_question_ids := array_append(v_used_question_ids, v_question.id);
          END LOOP;
        END IF;
      END IF;
    END LOOP;
    
  ELSE
    -- المسار القديم: مصدر واحد فقط (للتوافق)
    v_total_needed := COALESCE(v_exam.questions_count, v_exam.total_questions, 10);
    
    IF v_exam.question_source_type = 'question_bank' THEN
      IF v_exam.selected_sections IS NULL OR array_length(v_exam.selected_sections, 1) IS NULL THEN
        RAISE EXCEPTION 'No sections selected for question_bank source';
      END IF;
      
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
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
      FOR v_question IN (
        SELECT tcq.*, 'teacher' as source
        FROM public.teacher_custom_questions tcq
        WHERE tcq.is_active = true
          AND tcq.teacher_id = v_exam.created_by
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
      FOR v_question IN (
        SELECT qb.*, 'bank' as source
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
  END IF;
  
  -- تحويل المصفوفة إلى JSONB
  IF v_questions_array IS NOT NULL THEN
    v_questions := array_to_json(v_questions_array)::jsonb;
  END IF;
  
  -- إرجاع النتيجة مع warnings
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
    'questions', COALESCE(v_questions, '[]'::JSONB),
    'warnings', v_warnings,
    'actual_count', jsonb_array_length(COALESCE(v_questions, '[]'::JSONB)),
    'expected_count', v_exam.total_questions,
    'has_fallback', CASE WHEN jsonb_array_length(v_warnings) > 0 THEN true ELSE false END
  );
END;
$function$;

COMMENT ON FUNCTION public.generate_exam_questions IS 'توليد أسئلة الامتحان مع Smart Fallback - يضمن الحصول على العدد الكامل من الأسئلة';