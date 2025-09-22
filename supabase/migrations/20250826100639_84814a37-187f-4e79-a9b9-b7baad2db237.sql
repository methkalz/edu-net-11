-- إنشاء bucket للصف العاشر
INSERT INTO storage.buckets (id, name, public)
VALUES ('grade10-documents', 'grade10-documents', false);

-- إنشاء policies للصف العاشر
CREATE POLICY "Grade 10 documents are viewable by authenticated users"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'grade10-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "School admins can upload Grade 10 documents"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'grade10-documents' 
  AND (
    get_user_role() IN ('school_admin', 'superadmin')
  )
);

CREATE POLICY "School admins can update Grade 10 documents"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'grade10-documents' 
  AND (
    get_user_role() IN ('school_admin', 'superadmin')
  )
);

CREATE POLICY "School admins can delete Grade 10 documents"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'grade10-documents' 
  AND (
    get_user_role() IN ('school_admin', 'superadmin')
  )
);