-- إصلاح دالة get_available_grade_levels للتعامل مع JSONB بشكل صحيح
CREATE OR REPLACE FUNCTION public.get_available_grade_levels(school_uuid uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  package_content jsonb;
  grade_content text;
  result_array text[] := '{}';
BEGIN
  -- الحصول على محتوى الباقة
  SELECT get_school_active_package(school_uuid)->'available_grade_contents' INTO package_content;
  
  -- إذا لم توجد باقة أو محتوى، إرجاع كل الصفوف
  IF package_content IS NULL THEN
    RETURN ARRAY['10', '11', '12']::text[];
  END IF;
  
  -- التكرار عبر عناصر JSONB array وتحويلها
  FOR grade_content IN SELECT jsonb_array_elements_text(package_content)
  LOOP
    CASE grade_content
      WHEN 'grade10' THEN result_array := array_append(result_array, '10');
      WHEN 'grade11' THEN result_array := array_append(result_array, '11');
      WHEN 'grade12' THEN result_array := array_append(result_array, '12');
      ELSE 
        -- إذا كان الكود إنجليزي مباشرة
        IF grade_content IN ('10', '11', '12') THEN
          result_array := array_append(result_array, grade_content);
        END IF;
    END CASE;
  END LOOP;
  
  -- إذا كانت النتيجة فارغة، إرجاع كل الصفوف
  IF array_length(result_array, 1) IS NULL THEN
    RETURN ARRAY['10', '11', '12']::text[];
  END IF;
  
  RETURN result_array;
END;
$function$;