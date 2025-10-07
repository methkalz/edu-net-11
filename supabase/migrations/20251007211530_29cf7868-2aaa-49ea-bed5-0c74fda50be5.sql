-- إضافة RLS Policy للسوبر آدمن لإدارة جميع المستندات
CREATE POLICY "Superadmins can manage all google documents"
ON public.google_documents
FOR ALL
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);