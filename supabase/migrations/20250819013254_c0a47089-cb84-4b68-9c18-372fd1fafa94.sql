-- تعديل الـ trigger function للتعامل مع user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_role app_role;
    user_school_id uuid;
    user_full_name text;
    user_email text;
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
    
    -- إدراج السجل في جدول profiles مع البيانات الصحيحة
    INSERT INTO public.profiles (
        user_id, 
        role, 
        full_name, 
        email,
        school_id
    )
    VALUES (
        NEW.id,
        user_role,
        user_full_name,
        user_email,
        user_school_id
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
            'trigger_source', 'handle_new_user'
        )
    );
    
    RETURN NEW;
END;
$function$;