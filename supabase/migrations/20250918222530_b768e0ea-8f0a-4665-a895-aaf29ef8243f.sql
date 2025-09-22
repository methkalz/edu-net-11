-- إنشاء دالة للحصول على مشاريع المعلم المسؤول عنها حسب الصفوف المعينة له
CREATE OR REPLACE FUNCTION public.get_teacher_assigned_projects(teacher_user_id uuid, project_grade text)
RETURNS TABLE(
  project_id uuid,
  student_id uuid,
  student_grade text,
  is_authorized boolean
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
      s.id as student_id,
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
    sg.student_id,
    sg.student_grade_level,
    CASE 
      WHEN tg.assigned_grade IS NOT NULL AND sg.student_grade_level = project_grade THEN true
      ELSE false
    END as is_authorized
  FROM student_grades sg
  LEFT JOIN teacher_grades tg ON tg.assigned_grade = sg.student_grade_level
  WHERE sg.student_grade_level = project_grade;
END;
$$;

-- إنشاء دالة للتحقق من صلاحية المعلم لرؤية مشروع معين
CREATE OR REPLACE FUNCTION public.can_teacher_access_project(teacher_user_id uuid, project_student_id uuid, project_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_grade text;
  teacher_grades text[];
  school_settings jsonb;
BEGIN
  -- التحقق من أن المستخدم معلم
  IF get_user_role() != 'teacher' THEN
    RETURN false;
  END IF;

  -- جلب إعدادات المدرسة
  SELECT get_school_content_settings(get_user_school_id()) INTO school_settings;
  
  -- إذا كانت المدرسة تسمح بعرض كل المحتوى، السماح بالوصول
  IF (school_settings->>'show_all_package_content')::boolean = true THEN
    RETURN true;
  END IF;

  -- جلب صف الطالب صاحب المشروع
  SELECT get_student_assigned_grade(project_student_id) INTO student_grade;
  
  -- جلب الصفوف المسؤول عنها المعلم
  SELECT get_teacher_assigned_grade_levels(teacher_user_id) INTO teacher_grades;
  
  -- التحقق من أن المعلم مسؤول عن صف الطالب
  IF student_grade = ANY(teacher_grades) THEN
    RETURN true;
  END IF;
  
  -- إذا كانت الإعدادات تسمح بالوصول المتقاطع، السماح
  IF (school_settings->>'allow_cross_grade_access')::boolean = true THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;