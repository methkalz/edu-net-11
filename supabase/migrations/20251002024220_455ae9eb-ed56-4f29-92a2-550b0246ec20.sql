-- حذف الـ policy القديمة إن وجدت
DROP POLICY IF EXISTS "Teachers can upload custom avatars" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update their custom avatars" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their custom avatars" ON storage.objects;

-- إنشاء policy محددة للـ INSERT
CREATE POLICY "Teachers can upload custom avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'custom-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('teacher', 'school_admin', 'superadmin')
    )
  )
);

-- policy للتحديث
CREATE POLICY "Teachers can update their custom avatars" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'custom-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('teacher', 'school_admin', 'superadmin')
    )
  )
);

-- policy للحذف
CREATE POLICY "Teachers can delete their custom avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'custom-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('teacher', 'school_admin', 'superadmin')
    )
  )
);