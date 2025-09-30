-- إضافة سياسة للمعلمين لعرض أحداث مدرستهم
CREATE POLICY "Teachers can view school events" 
ON public.calendar_events
FOR SELECT
USING (
  is_active = true
  AND school_id = get_user_school_id()
  AND get_user_role() = 'teacher'::app_role
  AND (
    -- المعلم يرى الأحداث التي أنشأها المدير
    created_by_role = 'school_admin'::app_role
    OR created_by_role = 'superadmin'::app_role
    -- المعلم يرى الأحداث التي أنشأها هو
    OR created_by = auth.uid()
  )
);