-- تشغل هذا السكريبت بعد إنشاء جميع الحسابات التجريبية
-- للوصول للسكريبت: Supabase Dashboard > SQL Editor

-- تحديث أدوار المستخدمين التجريبيين ومدارسهم
DO $$
DECLARE
    demo_school_id UUID;
    superadmin_user_id UUID;
    schooladmin_user_id UUID;
    teacher_user_id UUID;
    student_user_id UUID;
    parent_user_id UUID;
BEGIN
    -- الحصول على معرف المدرسة التجريبية
    SELECT id INTO demo_school_id 
    FROM public.schools 
    WHERE name = 'Demo School';
    
    -- الحصول على معرفات المستخدمين من خلال البريد الإلكتروني
    SELECT user_id INTO superadmin_user_id 
    FROM public.profiles 
    WHERE email = 'superadmin@demo.com';
    
    SELECT user_id INTO schooladmin_user_id 
    FROM public.profiles 
    WHERE email = 'schooladmin@demo.com';
    
    SELECT user_id INTO teacher_user_id 
    FROM public.profiles 
    WHERE email = 'teacher@demo.com';
    
    SELECT user_id INTO student_user_id 
    FROM public.profiles 
    WHERE email = 'student@demo.com';
    
    SELECT user_id INTO parent_user_id 
    FROM public.profiles 
    WHERE email = 'parent@demo.com';
    
    -- تحديث أدوار ومدارس المستخدمين
    IF superadmin_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'superadmin', school_id = NULL 
        WHERE user_id = superadmin_user_id;
    END IF;
    
    IF schooladmin_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'school_admin', school_id = demo_school_id 
        WHERE user_id = schooladmin_user_id;
    END IF;
    
    IF teacher_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'teacher', school_id = demo_school_id 
        WHERE user_id = teacher_user_id;
    END IF;
    
    IF student_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'student', school_id = demo_school_id 
        WHERE user_id = student_user_id;
    END IF;
    
    IF parent_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'parent', school_id = demo_school_id 
        WHERE user_id = parent_user_id;
    END IF;
    
    -- إنشاء علاقة ولي أمر-طالب
    IF parent_user_id IS NOT NULL AND student_user_id IS NOT NULL THEN
        INSERT INTO public.guardians (parent_user_id, student_user_id, relationship)
        VALUES (parent_user_id, student_user_id, 'parent')
        ON CONFLICT (parent_user_id, student_user_id) DO NOTHING;
    END IF;
    
    -- تسجيل المعلم والطالب في مادة Computer Networking
    IF teacher_user_id IS NOT NULL THEN
        INSERT INTO public.enrollments (course_id, user_id, role_in_course)
        SELECT c.id, teacher_user_id, 'teacher'
        FROM public.courses c
        WHERE c.title = 'Computer Networking'
        ON CONFLICT (course_id, user_id) DO NOTHING;
    END IF;
    
    IF student_user_id IS NOT NULL THEN
        INSERT INTO public.enrollments (course_id, user_id, role_in_course)
        SELECT c.id, student_user_id, 'student'
        FROM public.courses c
        WHERE c.title = 'Computer Networking'
        ON CONFLICT (course_id, user_id) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'تم تحديث أدوار المستخدمين التجريبيين بنجاح';
END $$;