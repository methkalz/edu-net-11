
-- المرحلة 1: تعديل RLS على جدول students

-- حذف السياسة الواسعة الخطيرة
DROP POLICY IF EXISTS "School members can view their school students" ON public.students;

-- حذف السياسة المكررة
DROP POLICY IF EXISTS "Users can view their own student record" ON public.students;

-- سياسة للطاقم فقط (معلم + مدير + سوبر آدمن)
CREATE POLICY "Staff can view school students" ON public.students
FOR SELECT TO authenticated
USING (
  (school_id = get_user_school_id() 
   AND get_user_role() IN ('teacher'::app_role, 'school_admin'::app_role))
  OR get_user_role() = 'superadmin'::app_role
);

-- المرحلة 2: إنشاء View آمن بدون security_invoker مع عزل على مستوى المدرسة
CREATE OR REPLACE VIEW public.secure_students_view AS 
SELECT id, full_name, school_id, created_at_utc 
FROM public.students
WHERE school_id = get_user_school_id();

GRANT SELECT ON public.secure_students_view TO authenticated;
