-- إضافة RLS للـ view المحسّن
CREATE POLICY "Teachers can view projects in their school"
ON public.teacher_projects_view
FOR SELECT
TO authenticated
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND 
  ((school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
);

-- تفعيل RLS على الـ view
ALTER VIEW public.teacher_projects_view SET (security_barrier = true);