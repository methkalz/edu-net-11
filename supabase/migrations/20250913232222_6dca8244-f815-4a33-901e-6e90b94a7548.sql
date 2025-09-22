-- إنشاء function جديد مخصص لجدول schools
CREATE OR REPLACE FUNCTION public.update_schools_updated_at_utc()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at_utc = now();
    RETURN NEW;
END;
$function$;

-- حذف الـ trigger الحالي إذا كان موجوداً
DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;

-- إنشاء trigger جديد يستخدم الـ function الصحيح
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.update_schools_updated_at_utc();