-- إنشاء دالة موحدة للحصول على الباقة النشطة للمدرسة
CREATE OR REPLACE FUNCTION public.get_school_active_package(school_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'name_ar', p.name_ar,
    'description_ar', p.description_ar,
    'available_grade_contents', p.available_grade_contents,
    'max_students', p.max_students,
    'max_teachers', p.max_teachers,
    'price', p.price,
    'currency', p.currency,
    'duration_days', p.duration_days,
    'features', p.features,
    'start_date', sp.start_date,
    'end_date', sp.end_date,
    'status', sp.status
  )
  FROM public.school_packages sp
  JOIN public.packages p ON sp.package_id = p.id
  WHERE sp.school_id = school_uuid 
    AND sp.status = 'active'
  ORDER BY sp.created_at DESC
  LIMIT 1;
$function$;

-- تحديث دالة get_available_grade_levels لتستخدم النظام الموحد
CREATE OR REPLACE FUNCTION public.get_available_grade_levels(school_uuid uuid)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (get_school_active_package(school_uuid)->>'available_grade_contents')::text[],
    ARRAY['10', '11', '12']::text[]
  );
$function$;

-- إنشاء دالة للحصول على معلومات الباقة مع الاستخدام الحالي
CREATE OR REPLACE FUNCTION public.get_school_package_with_usage(school_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_info jsonb;
  current_students integer;
  current_teachers integer;
BEGIN
  -- الحصول على معلومات الباقة
  SELECT get_school_active_package(school_uuid) INTO package_info;
  
  IF package_info IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- حساب عدد الطلاب الحالي
  SELECT COUNT(*) INTO current_students
  FROM public.students
  WHERE school_id = school_uuid;
  
  -- حساب عدد المعلمين الحالي
  SELECT COUNT(*) INTO current_teachers
  FROM public.profiles
  WHERE school_id = school_uuid AND role = 'teacher';
  
  -- إضافة معلومات الاستخدام
  RETURN jsonb_set(
    jsonb_set(
      package_info,
      '{current_students}',
      to_jsonb(current_students)
    ),
    '{current_teachers}',
    to_jsonb(current_teachers)
  );
END;
$function$;