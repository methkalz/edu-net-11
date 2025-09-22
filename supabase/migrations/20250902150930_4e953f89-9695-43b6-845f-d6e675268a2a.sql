-- إصلاح search_path للدوال الموجودة
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = 'public';

-- إعادة إنشاء دالة update_updated_at_column بـ search_path آمن
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;