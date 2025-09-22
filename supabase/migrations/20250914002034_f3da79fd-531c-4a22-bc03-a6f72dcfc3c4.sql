-- إصلاح دالة get_teacher_assigned_grade_levels لإرجاع الأكواد الإنجليزية
CREATE OR REPLACE FUNCTION public.get_teacher_assigned_grade_levels(teacher_user_id uuid)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ARRAY_AGG(DISTINCT 
    CASE tag.grade_level_label
      WHEN 'الصف العاشر' THEN '10'
      WHEN 'الصف الحادي عشر' THEN '11' 
      WHEN 'الصف الثاني عشر' THEN '12'
      ELSE tag.grade_level_label
    END
  )
  FROM public.teacher_assigned_grades tag
  WHERE tag.teacher_id = teacher_user_id;
$function$;