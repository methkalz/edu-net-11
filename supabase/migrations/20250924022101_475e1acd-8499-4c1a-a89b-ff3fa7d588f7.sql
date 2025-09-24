-- إنشاء سياسات الأمان لجدول document_versions
-- السماح للمستخدمين بعرض إصدارات الوثائق الخاصة بهم
CREATE POLICY "Users can view document versions they created" 
ON public.document_versions 
FOR SELECT 
USING (created_by = auth.uid());

-- السماح للمستخدمين بإنشاء إصدارات جديدة
CREATE POLICY "Users can create document versions" 
ON public.document_versions 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- المدراء يمكنهم عرض جميع إصدارات الوثائق في مدرستهم
CREATE POLICY "School admins can view all document versions in their school" 
ON public.document_versions 
FOR SELECT 
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]) AND
  EXISTS (
    SELECT 1 FROM public.professional_documents pd 
    WHERE pd.id = document_versions.document_id 
    AND (pd.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);