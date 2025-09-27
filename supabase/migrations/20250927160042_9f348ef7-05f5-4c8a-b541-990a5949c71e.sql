-- الحل الذكي والبسيط لمشكلة الـ avatars

-- 1. إصلاح فوري لعبد الباسط والمستخدمين الآخرين بدون avatars
UPDATE public.profiles 
SET avatar_url = CASE 
    WHEN (hashtext(user_id::text) % 7) = 0 THEN 'student1.png'
    WHEN (hashtext(user_id::text) % 7) = 1 THEN 'student2.png' 
    WHEN (hashtext(user_id::text) % 7) = 2 THEN 'student3.png'
    WHEN (hashtext(user_id::text) % 7) = 3 THEN 'student4.png'
    WHEN (hashtext(user_id::text) % 7) = 4 THEN 'student5.png'
    WHEN (hashtext(user_id::text) % 7) = 5 THEN 'scholar.png'
    ELSE 'master.png'
END
WHERE avatar_url IS NULL OR avatar_url = '';

-- 2. تحديث handle_new_user function لتعيين avatar تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    user_role app_role;
    user_school_id uuid;
    user_full_name text;
    user_email text;
    user_avatar text;
BEGIN
    -- قراءة البيانات من user_metadata
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::app_role,
        'student'::app_role
    );
    
    user_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;
    
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    
    user_email := NEW.email;
    
    -- تعيين avatar تلقائياً باستخدام hash
    user_avatar := CASE 
        WHEN (hashtext(NEW.id::text) % 7) = 0 THEN 'student1.png'
        WHEN (hashtext(NEW.id::text) % 7) = 1 THEN 'student2.png' 
        WHEN (hashtext(NEW.id::text) % 7) = 2 THEN 'student3.png'
        WHEN (hashtext(NEW.id::text) % 7) = 3 THEN 'student4.png'
        WHEN (hashtext(NEW.id::text) % 7) = 4 THEN 'student5.png'
        WHEN (hashtext(NEW.id::text) % 7) = 5 THEN 'scholar.png'
        ELSE 'master.png'
    END;
    
    -- إدراج السجل في جدول profiles مع البيانات الصحيحة
    INSERT INTO public.profiles (
        user_id, 
        role, 
        full_name, 
        email,
        school_id,
        avatar_url
    )
    VALUES (
        NEW.id,
        user_role,
        user_full_name,
        user_email,
        user_school_id,
        user_avatar
    );
    
    -- تسجيل العملية في audit log
    INSERT INTO public.audit_log (
        actor_user_id,
        action,
        entity,
        payload_json
    ) VALUES (
        NEW.id,
        'USER_PROFILE_CREATED',
        'profiles',
        json_build_object(
            'user_id', NEW.id,
            'role', user_role,
            'school_id', user_school_id,
            'avatar_assigned', user_avatar,
            'trigger_source', 'handle_new_user'
        )
    );
    
    RETURN NEW;
END;
$function$;