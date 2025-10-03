-- تفعيل RLS على جدول المستندات المهنية
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم رؤية مستنداتهم
CREATE POLICY "Users can view own documents"
ON public.professional_documents
FOR SELECT
USING (user_id = auth.uid());

-- Policy: مدراء المدرسة يمكنهم رؤية مستندات مدرستهم
CREATE POLICY "School admins can view school documents"
ON public.professional_documents
FOR SELECT
USING (
  get_user_role() IN ('school_admin', 'superadmin') 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin')
);

-- Policy: المستخدمون يمكنهم إنشاء مستنداتهم
CREATE POLICY "Users can create own documents"
ON public.professional_documents
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: المستخدمون يمكنهم تحديث مستنداتهم
CREATE POLICY "Users can update own documents"
ON public.professional_documents
FOR UPDATE
USING (user_id = auth.uid());

-- Policy: المستخدمون يمكنهم حذف مستنداتهم
CREATE POLICY "Users can delete own documents"
ON public.professional_documents
FOR DELETE
USING (user_id = auth.uid());

-- Trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_professional_documents_updated_at
BEFORE UPDATE ON public.professional_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_professional_documents_updated_at();