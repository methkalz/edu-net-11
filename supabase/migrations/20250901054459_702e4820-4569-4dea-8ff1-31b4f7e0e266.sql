-- إصلاح باقي الـ functions لحل مشاكل الأمان

-- تحديث دالة get_user_role مع إعدادات الأمان
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- تحديث دالة get_user_school_id مع إعدادات الأمان
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid();
$$;