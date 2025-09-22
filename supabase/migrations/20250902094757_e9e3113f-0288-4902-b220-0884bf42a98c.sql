-- المرحلة الثانية: تفعيل النظام الذكي - نسخة مبسطة

-- أولاً: إضافة تكوينات الصعوبة للدروس الموجودة
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

-- ثانياً: إضافة مفاهيم للدروس الموجودة
INSERT INTO public.grade11_content_concepts (lesson_id, concept_text, concept_type, importance_level)
SELECT 
    l.id,
    'مفهوم أساسي: ' || l.title,
    'definition',
    3
FROM public.grade11_lessons l
WHERE NOT EXISTS (
    SELECT 1 FROM public.grade11_content_concepts cc 
    WHERE cc.lesson_id = l.id
)
LIMIT 22;

-- ثالثاً: إضافة أسئلة جديدة متنوعة
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
LIMIT 22;

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
LIMIT 22;

-- أسئلة صعبة - هذا ما كان مفقوداً!
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
LIMIT 22;

-- أسئلة صواب وخطأ متنوعة
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
LIMIT 22;