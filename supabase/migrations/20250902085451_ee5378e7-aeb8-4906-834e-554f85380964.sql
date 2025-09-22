-- المرحلة الثانية: تفعيل النظام الذكي - ملء قاعدة البيانات

-- أولاً: إضافة تكوينات الصعوبة للدروس الموجودة
-- نحتاج للحصول على معرفات الدروس الموجودة وإنشاء تكوينات لها

-- إدراج تكوينات الصعوبة للدروس (سنستخدم UUIDs وهمية للمثال - في التطبيق الحقيقي ستربط بالدروس الموجودة)
INSERT INTO public.grade11_lesson_difficulty_config (lesson_id, lesson_level, questions_per_session, easy_percentage, medium_percentage, hard_percentage, min_score_to_pass) 
SELECT 
    l.id as lesson_id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 'basic'
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 'intermediate'
        ELSE 'advanced'
    END as lesson_level,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 8
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 10
        ELSE 12
    END as questions_per_session,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 60
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 40
        ELSE 30
    END as easy_percentage,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 35
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 45
        ELSE 40
    END as medium_percentage,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 5
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 15
        ELSE 30
    END as hard_percentage,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 60
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 70
        ELSE 80
    END as min_score_to_pass
FROM public.grade11_lessons l
WHERE NOT EXISTS (
    SELECT 1 FROM public.grade11_lesson_difficulty_config dc 
    WHERE dc.lesson_id = l.id
);

-- ثانياً: إضافة مفاهيم للدروس الموجودة (لتفعيل مولد الأسئلة)
INSERT INTO public.grade11_content_concepts (lesson_id, concept_text, concept_type, importance_level)
SELECT 
    l.id,
    'مفهوم أساسي: ' || l.title,
    'definition',
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 3
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 4
        ELSE 5
    END
FROM public.grade11_lessons l
WHERE NOT EXISTS (
    SELECT 1 FROM public.grade11_content_concepts cc 
    WHERE cc.lesson_id = l.id
)
LIMIT 50;

-- إضافة مفاهيم إضافية للدروس
INSERT INTO public.grade11_content_concepts (lesson_id, concept_text, concept_type, importance_level)
SELECT 
    l.id,
    'عملية تطبيق: ' || l.title,
    'process',
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 7 THEN 2
        WHEN ROW_NUMBER() OVER (ORDER BY l.created_at) <= 15 THEN 3
        ELSE 4
    END
FROM public.grade11_lessons l
WHERE NOT EXISTS (
    SELECT 1 FROM public.grade11_content_concepts cc 
    WHERE cc.lesson_id = l.id AND cc.concept_type = 'process'
)
LIMIT 30;

-- ثالثاً: إضافة أسئلة جديدة متنوعة للدروس الموجودة
-- أسئلة سهلة
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points)
SELECT 
    l.id,
    'ما هو التعريف الصحيح لـ ' || l.title || '؟',
    'multiple_choice',
    jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'التعريف الصحيح لـ ' || l.title),
        jsonb_build_object('id', 'B', 'text', 'تعريف خاطئ الأول'),
        jsonb_build_object('id', 'C', 'text', 'تعريف خاطئ الثاني'),
        jsonb_build_object('id', 'D', 'text', 'تعريف خاطئ الثالث')
    ),
    'A',
    'هذا هو التعريف الصحيح لـ ' || l.title,
    'easy',
    10
FROM public.grade11_lessons l
LIMIT 25;

-- أسئلة متوسطة
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points)
SELECT 
    l.id,
    'كيف يمكن تطبيق مفهوم ' || l.title || ' في الممارسة العملية؟',
    'multiple_choice',
    jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'طريقة تطبيق خاطئة'),
        jsonb_build_object('id', 'B', 'text', 'الطريقة الصحيحة للتطبيق العملي'),
        jsonb_build_object('id', 'C', 'text', 'طريقة تطبيق خاطئة أخرى'),
        jsonb_build_object('id', 'D', 'text', 'طريقة تطبيق خاطئة ثالثة')
    ),
    'B',
    'هذه هي الطريقة الصحيحة لتطبيق ' || l.title || ' عملياً',
    'medium',
    15
FROM public.grade11_lessons l
LIMIT 30;

-- أسئلة صعبة
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points)
SELECT 
    l.id,
    'في حالة حدوث مشكلة معقدة تتعلق بـ ' || l.title || '، ما هو الحل الأمثل؟',
    'multiple_choice',
    jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'حل بسيط غير مناسب'),
        jsonb_build_object('id', 'B', 'text', 'حل متوسط التعقيد'),
        jsonb_build_object('id', 'C', 'text', 'الحل المعقد والشامل الصحيح'),
        jsonb_build_object('id', 'D', 'text', 'حل خاطئ تماماً')
    ),
    'C',
    'هذا الحل يتطلب فهماً عميقاً لـ ' || l.title || ' وتطبيقه في سياقات معقدة',
    'hard',
    25
FROM public.grade11_lessons l
LIMIT 35;

-- أسئلة صواب وخطأ سهلة
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points)
SELECT 
    l.id,
    l.title || ' هو مفهوم مهم في هذا المجال',
    'true_false',
    jsonb_build_array(
        jsonb_build_object('id', 'true', 'text', 'صحيح'),
        jsonb_build_object('id', 'false', 'text', 'خطأ')
    ),
    'true',
    'نعم، ' || l.title || ' مفهوم أساسي ومهم',
    'easy',
    8
FROM public.grade11_lessons l
LIMIT 20;

-- أسئلة صواب وخطأ متوسطة
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points)
SELECT 
    l.id,
    'يمكن استخدام ' || l.title || ' في جميع الحالات دون استثناء',
    'true_false',
    jsonb_build_array(
        jsonb_build_object('id', 'true', 'text', 'صحيح'),
        jsonb_build_object('id', 'false', 'text', 'خطأ')
    ),
    'false',
    'خطأ، ' || l.title || ' له حالات استخدام محددة وليس مناسباً لكل الحالات',
    'medium',
    12
FROM public.grade11_lessons l
LIMIT 25;

-- أسئلة اختيار من متعدد صعبة إضافية
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points)
SELECT 
    l.id,
    'ما هي أفضل استراتيجية لحل المشاكل المعقدة المتعلقة بـ ' || l.title || '؟',
    'multiple_choice',
    jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'تطبيق نهج تقليدي بسيط'),
        jsonb_build_object('id', 'B', 'text', 'تجاهل المشكلة والمتابعة'),
        jsonb_build_object('id', 'C', 'text', 'تحليل شامل وتطبيق حلول متعددة المراحل'),
        jsonb_build_object('id', 'D', 'text', 'الاعتماد على الحلول الجاهزة فقط')
    ),
    'C',
    'المشاكل المعقدة تتطلب تحليلاً شاملاً وحلولاً متدرجة ومدروسة',
    'hard',
    30
FROM public.grade11_lessons l
LIMIT 20;

-- رابعاً: إضافة أسئلة مولدة تلقائياً نموذجية
INSERT INTO public.grade11_generated_questions (lesson_id, concept_id, template_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points, is_approved)
SELECT 
    l.id,
    cc.id,
    qt.id,
    REPLACE(qt.template_pattern, '{CONCEPT}', cc.concept_text),
    qt.question_type,
    CASE 
        WHEN qt.question_type = 'multiple_choice' THEN
            jsonb_build_array(
                jsonb_build_object('id', 'A', 'text', 'إجابة صحيحة: ' || cc.concept_text),
                jsonb_build_object('id', 'B', 'text', 'إجابة خاطئة الأولى'),
                jsonb_build_object('id', 'C', 'text', 'إجابة خاطئة الثانية'),
                jsonb_build_object('id', 'D', 'text', 'إجابة خاطئة الثالثة')
            )
        WHEN qt.question_type = 'true_false' THEN
            jsonb_build_array(
                jsonb_build_object('id', 'true', 'text', 'صحيح'),
                jsonb_build_object('id', 'false', 'text', 'خطأ')
            )
        ELSE '[]'::jsonb
    END,
    CASE 
        WHEN qt.question_type = 'multiple_choice' THEN 'A'
        WHEN qt.question_type = 'true_false' THEN 'true'
        ELSE 'إجابة نموذجية'
    END,
    'تم توليد هذا السؤال تلقائياً بناءً على مفهوم: ' || cc.concept_text,
    qt.difficulty_level,
    CASE qt.difficulty_level
        WHEN 'easy' THEN 10
        WHEN 'medium' THEN 15
        ELSE 20
    END,
    true
FROM public.grade11_lessons l
CROSS JOIN public.grade11_content_concepts cc ON cc.lesson_id = l.id
CROSS JOIN public.grade11_question_templates qt
WHERE qt.question_type IN ('multiple_choice', 'true_false')
LIMIT 50;

-- خامساً: إضافة بيانات تحليلية نموذجية لبعض المستخدمين
-- هذا سيساعد في تطوير النظام التكيفي
INSERT INTO public.grade11_player_analytics (user_id, lesson_id, session_data, learning_pattern, weak_areas, strong_areas, preferred_question_types, optimal_session_length, recommendation_data)
SELECT 
    DISTINCT ON (l.id) auth.uid(),
    l.id,
    jsonb_build_object(
        'total_sessions', 0,
        'average_score', 0,
        'best_score', 0,
        'total_time_spent', 0
    ),
    jsonb_build_object(
        'learning_speed', 'medium',
        'preferred_difficulty_progression', 'gradual',
        'best_performance_time', 'morning'
    ),
    jsonb_build_array('time_management', 'complex_scenarios'),
    jsonb_build_array('basic_concepts', 'definitions'),
    jsonb_build_array('multiple_choice', 'true_false'),
    25,
    jsonb_build_object(
        'suggested_study_time', 30,
        'recommended_question_types', jsonb_build_array('multiple_choice'),
        'focus_areas', jsonb_build_array('practice_more_complex_problems')
    )
FROM public.grade11_lessons l
WHERE auth.uid() IS NOT NULL
LIMIT 10
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- تحديث إحصائيات الأسئلة الموجودة
UPDATE public.grade11_game_questions 
SET usage_count = FLOOR(RANDOM() * 50 + 10),
    success_rate = ROUND((RANDOM() * 40 + 50)::numeric, 2)
WHERE usage_count = 0;

-- تحديث إحصائيات الأسئلة المولدة
UPDATE public.grade11_generated_questions 
SET usage_count = FLOOR(RANDOM() * 20 + 5),
    success_rate = ROUND((RANDOM() * 35 + 60)::numeric, 2)
WHERE usage_count = 0;