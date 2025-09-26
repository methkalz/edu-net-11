-- إصلاح سياسات RLS لجدول students للسماح للمعلمين بإضافة طلاب

-- إزالة السياسة المتضاربة
DROP POLICY IF EXISTS "Teachers cannot access sensitive student data directly" ON public.students;

-- تحديث سياسة المعلمين لتكون أكثر وضوحاً
DROP POLICY IF EXISTS "Teachers and admins can manage students in their school" ON public.students;

CREATE POLICY "Teachers can add and manage students in their school" ON public.students
FOR ALL
USING (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  (school_id = get_user_school_id()) AND 
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
);