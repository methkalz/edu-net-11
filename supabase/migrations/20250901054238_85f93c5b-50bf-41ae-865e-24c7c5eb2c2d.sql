-- إصلاح مشكلة تحديث المدارس

-- 1. تحديث الـ function لتدعم كلاً من updated_at و updated_at_utc
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- للجداول التي تستخدم updated_at_utc
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = TG_TABLE_NAME 
               AND column_name = 'updated_at_utc' 
               AND table_schema = 'public') THEN
        NEW.updated_at_utc = now();
    -- للجداول التي تستخدم updated_at
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = TG_TABLE_NAME 
                  AND column_name = 'updated_at' 
                  AND table_schema = 'public') THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. إنشاء trigger للمدارس (إذا لم يكن موجوداً)
DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();