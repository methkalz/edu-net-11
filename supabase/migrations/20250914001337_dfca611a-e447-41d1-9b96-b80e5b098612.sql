-- تحديث جدول grade_levels ليستخدم أكواد إنجليزية
-- إضافة حقل code جديد
ALTER TABLE public.grade_levels ADD COLUMN code text;

-- تحديث البيانات الحالية بالأكواد الإنجليزية
UPDATE public.grade_levels 
SET code = '10' 
WHERE label = 'الصف العاشر';

UPDATE public.grade_levels 
SET code = '11' 
WHERE label = 'الصف الحادي عشر';

UPDATE public.grade_levels 
SET code = '12' 
WHERE label = 'الصف الثاني عشر';

-- جعل حقل code مطلوب وفريد
ALTER TABLE public.grade_levels ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.grade_levels ADD CONSTRAINT grade_levels_code_unique UNIQUE (code);

-- تحديث دالة get_available_grade_levels لإرجاع الأكواد الإنجليزية
CREATE OR REPLACE FUNCTION public.get_available_grade_levels(school_uuid uuid)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT array_agg(DISTINCT 
      CASE 
        WHEN unnest = 'grade10' THEN '10'
        WHEN unnest = 'grade11' THEN '11'
        WHEN unnest = 'grade12' THEN '12'
        ELSE unnest
      END
    )
    FROM unnest(
      COALESCE(
        (get_school_active_package(school_uuid)->>'available_grade_contents')::text[],
        ARRAY['grade10', 'grade11', 'grade12']::text[]
      )
    )),
    ARRAY['10', '11', '12']::text[]
  );
$function$;