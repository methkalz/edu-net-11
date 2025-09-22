-- إصلاح التحذيرات الأمنية - إضافة search_path للدوال

-- 1. تحديث دالة update_updated_at_column لتكون آمنة
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 2. تحديث دالة update_pair_matching_games_updated_at لتكون آمنة
DROP FUNCTION IF EXISTS public.update_pair_matching_games_updated_at();
CREATE OR REPLACE FUNCTION public.update_pair_matching_games_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;