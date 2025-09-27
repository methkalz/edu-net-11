-- حل نهائي وجذري للـ avatar system

-- 1. التأكد من وجود الـ function
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- 2. إعادة إنشاء الـ function بشكل آمن
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    user_email := NEW.email;
    
    -- تعيين avatar تلقائياً (اسم الملف فقط)
    user_avatar := CASE 
        WHEN (hashtext(NEW.id::text) % 7) = 0 THEN 'student1.png'
        WHEN (hashtext(NEW.id::text) % 7) = 1 THEN 'student2.png' 
        WHEN (hashtext(NEW.id::text) % 7) = 2 THEN 'student3.png'
        WHEN (hashtext(NEW.id::text) % 7) = 3 THEN 'student4.png'
        WHEN (hashtext(NEW.id::text) % 7) = 4 THEN 'student5.png'
        WHEN (hashtext(NEW.id::text) % 7) = 5 THEN 'scholar.png'
        ELSE 'master.png'
    END;
    
    -- إدراج السجل في جدول profiles
    INSERT INTO public.profiles (
        user_id, role, full_name, email, school_id, avatar_url
    ) VALUES (
        NEW.id, user_role, user_full_name, user_email, user_school_id, user_avatar
    );
    
    -- تسجيل في audit log
    INSERT INTO public.audit_log (
        actor_user_id, action, entity, payload_json
    ) VALUES (
        NEW.id, 'USER_PROFILE_CREATED', 'profiles',
        json_build_object(
            'user_id', NEW.id, 'avatar_assigned', user_avatar
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- في حالة أي خطأ، تسجيله والمتابعة
        INSERT INTO public.audit_log (
            actor_user_id, action, entity, payload_json
        ) VALUES (
            NEW.id, 'USER_PROFILE_CREATION_ERROR', 'profiles',
            json_build_object('error', SQLERRM)
        );
        RETURN NEW;
END;
$function$;

-- 3. إنشاء الـ trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();