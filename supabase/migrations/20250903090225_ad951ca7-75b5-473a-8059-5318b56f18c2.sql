-- إصلاح التحذيرات الأمنية

-- 1. إصلاح search_path للدوال الموجودة
ALTER FUNCTION public.get_user_school_id() SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.get_user_role() SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.get_exam_question_for_student(uuid) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.get_students_for_teacher() SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.get_students_for_school_admin() SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.validate_email_format(text) SET search_path TO 'public';
ALTER FUNCTION public.validate_phone_format(text) SET search_path TO 'public';
ALTER FUNCTION public.check_rate_limit(text, text, integer, integer, integer) SECURITY DEFINER SET search_path TO 'public';