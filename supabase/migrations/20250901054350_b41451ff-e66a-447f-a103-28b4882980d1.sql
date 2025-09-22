-- إصلاح مشاكل الأمان في الـ functions

-- تحديث دالة update_updated_at_column مع إعدادات الأمان
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;