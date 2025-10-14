-- تعديل دالة get_teacher_assigned_projects لترجع user_id بدلاً من students.id
CREATE OR REPLACE FUNCTION public.get_teacher_assigned_projects(teacher_user_id uuid, project_grade text)
 RETURNS TABLE(project_id uuid, student_id uuid, student_grade text, is_authorized boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من أن المستخدم معلم
  IF get_user_role() != 'teacher' THEN
    RAISE EXCEPTION 'Access denied. Only teachers can access this function.';
  END IF;

  -- جلب الصفوف المسؤول عنها المعلم
  RETURN QUERY
  WITH teacher_grades AS (
    SELECT UNNEST(get_teacher_assigned_grade_levels(teacher_user_id)) as assigned_grade
  ),
  student_grades AS (
    SELECT 
      s.user_id as student_user_id,  -- تغيير من s.id إلى s.user_id
      CASE 
        WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
        WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'  
        WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
        ELSE COALESCE(gl.code, '11')
      END as student_grade_level
    FROM public.students s
    JOIN public.class_students cs ON cs.student_id = s.id
    JOIN public.classes c ON c.id = cs.class_id
    JOIN public.grade_levels gl ON gl.id = c.grade_level_id
    WHERE s.school_id = get_user_school_id()
  )
  SELECT 
    NULL::uuid as project_id,
    sg.student_user_id as student_id,  -- استخدام student_user_id
    sg.student_grade_level,
    CASE 
      WHEN tg.assigned_grade IS NOT NULL AND sg.student_grade_level = project_grade THEN true
      ELSE false
    END as is_authorized
  FROM student_grades sg
  LEFT JOIN teacher_grades tg ON tg.assigned_grade = sg.student_grade_level
  WHERE sg.student_grade_level = project_grade;
END;
$function$;