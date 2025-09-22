-- Create demo users for testing
-- Note: In real production, users should be created through the signup process
-- These are for demo purposes only

-- First, let's get school IDs for reference
DO $$
DECLARE
    demo_school_id UUID;
    basic_school_id UUID;
    superadmin_id UUID;
    school_admin_id UUID;
    teacher_id UUID;
    student_id UUID;
    parent_id UUID;
BEGIN
    -- Get school IDs
    SELECT id INTO demo_school_id FROM public.schools WHERE name = 'Demo School';
    SELECT id INTO basic_school_id FROM public.schools WHERE name = 'Basic School';
    
    -- Create demo user profiles (these will be linked when users actually sign up)
    -- We'll create placeholder profiles that can be updated when real users sign up
    
    -- Insert demo data into profiles table for testing
    -- Note: user_id will be filled when actual users sign up
    
    -- For now, let's create some sample data structure
    -- Insert demo lessons and courses for testing
    INSERT INTO public.lessons (course_id, title, description, content, order_index) 
    SELECT 
        c.id, 
        'الدرس الأول - مقدمة', 
        'درس تعريفي عن المادة', 
        'محتوى الدرس الأول', 
        1
    FROM public.courses c 
    WHERE c.title = 'Computer Networking';
    
    INSERT INTO public.lessons (course_id, title, description, content, order_index) 
    SELECT 
        c.id, 
        'الدرس الثاني - أساسيات الشبكات', 
        'درس عن أساسيات الشبكات', 
        'محتوى الدرس الثاني', 
        2
    FROM public.courses c 
    WHERE c.title = 'Computer Networking';
    
    -- Insert demo exercises
    INSERT INTO public.exercises (lesson_id, title, description, max_score)
    SELECT 
        l.id,
        'تمرين ' || l.title,
        'تمرين تطبيقي على ' || l.title,
        100
    FROM public.lessons l;
    
    -- Insert demo exams
    INSERT INTO public.exams (course_id, title, description, starts_at, duration_minutes, randomized)
    SELECT 
        c.id,
        'امتحان ' || c.title,
        'امتحان شامل في مادة ' || c.title,
        NOW() + INTERVAL '7 days',
        90,
        true
    FROM public.courses c;
    
    -- Insert demo exam questions
    INSERT INTO public.exam_questions (exam_id, bank_category, question_text, question_type, choices, correct_answer, points)
    SELECT 
        e.id,
        'basic',
        'ما هو عنوان IP؟',
        'multiple_choice',
        '["عنوان فريد للجهاز على الشبكة", "برنامج حاسوبي", "نوع من الكابلات", "معالج الشبكة"]'::jsonb,
        'عنوان فريد للجهاز على الشبكة',
        5
    FROM public.exams e
    WHERE e.title LIKE '%Computer Networking%';
    
    INSERT INTO public.exam_questions (exam_id, bank_category, question_text, question_type, choices, correct_answer, points)
    SELECT 
        e.id,
        'basic',
        'كم طبقة في نموذج OSI؟',
        'multiple_choice',
        '["5 طبقات", "6 طبقات", "7 طبقات", "8 طبقات"]'::jsonb,
        '7 طبقات',
        5
    FROM public.exams e
    WHERE e.title LIKE '%Computer Networking%';
    
    -- Insert demo projects
    INSERT INTO public.projects (course_id, title, description, due_at, max_score)
    SELECT 
        c.id,
        'مشروع شبكة محلية',
        'تصميم وتنفيذ شبكة محلية باستخدام Packet Tracer',
        NOW() + INTERVAL '14 days',
        100
    FROM public.courses c
    WHERE c.title = 'Computer Networking';
    
    -- Insert demo project tasks
    INSERT INTO public.project_tasks (project_id, title, description, due_at, order_index)
    SELECT 
        p.id,
        'المرحلة الأولى: التخطيط',
        'رسم مخطط الشبكة وتحديد المتطلبات',
        NOW() + INTERVAL '7 days',
        1
    FROM public.projects p
    WHERE p.title = 'مشروع شبكة محلية';
    
    INSERT INTO public.project_tasks (project_id, title, description, due_at, order_index)
    SELECT 
        p.id,
        'المرحلة الثانية: التنفيذ',
        'تنفيذ الشبكة في Packet Tracer',
        NOW() + INTERVAL '14 days',
        2
    FROM public.projects p
    WHERE p.title = 'مشروع شبكة محلية';
    
END $$;

-- Create a special function for demo account creation
CREATE OR REPLACE FUNCTION public.create_demo_profile(
    p_email TEXT,
    p_full_name TEXT,
    p_role public.app_role,
    p_school_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- Generate a UUID for demo profile
    profile_id := gen_random_uuid();
    
    -- Insert demo profile
    INSERT INTO public.profiles (user_id, role, school_id, full_name, email)
    VALUES (profile_id, p_role, p_school_id, p_full_name, p_email);
    
    RETURN profile_id;
END;
$$;

-- Create demo profiles
DO $$
DECLARE
    demo_school_id UUID;
    basic_school_id UUID;
BEGIN
    SELECT id INTO demo_school_id FROM public.schools WHERE name = 'Demo School';
    SELECT id INTO basic_school_id FROM public.schools WHERE name = 'Basic School';
    
    -- Create demo profiles for each role
    PERFORM public.create_demo_profile('superadmin@demo.com', 'مدير النظام الرئيسي', 'superadmin', NULL);
    PERFORM public.create_demo_profile('schooladmin@demo.com', 'مدير المدرسة التجريبية', 'school_admin', demo_school_id);
    PERFORM public.create_demo_profile('teacher@demo.com', 'المعلم محمد أحمد', 'teacher', demo_school_id);
    PERFORM public.create_demo_profile('student@demo.com', 'الطالب علي محمد', 'student', demo_school_id);
    PERFORM public.create_demo_profile('parent@demo.com', 'ولي الأمر سارة أحمد', 'parent', demo_school_id);
END $$;