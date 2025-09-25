-- حذف السياسات الموجودة وإعادة إنشائها بصلاحيات المعلمين
DROP POLICY IF EXISTS "Teachers and admins can manage their school classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers and admins can manage their school class names" ON public.class_names;
DROP POLICY IF EXISTS "Teachers and admins can manage class enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers and admins can manage students in their school" ON public.students;

-- السماح للمعلمين ومدراء المدارس بإدارة الصفوف
CREATE POLICY "Teachers and admins can manage their school classes" 
ON public.classes 
FOR ALL 
USING (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
);

-- السماح للمعلمين ومدراء المدارس بإدارة أسماء الصفوف
CREATE POLICY "Teachers and admins can manage their school class names" 
ON public.class_names 
FOR ALL 
USING (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
);

-- السماح للمعلمين ومدراء المدارس بإدارة تسجيل الطلاب في الصفوف
CREATE POLICY "Teachers and admins can manage class enrollments" 
ON public.class_students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.id = class_students.class_id 
    AND c.school_id = get_user_school_id() 
    AND get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.id = class_students.class_id 
    AND c.school_id = get_user_school_id() 
    AND get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
  )
);

-- السماح للمعلمين ومدراء المدارس بإدارة الطلاب في مدرستهم
CREATE POLICY "Teachers and admins can manage students in their school" 
ON public.students 
FOR ALL 
USING (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
);