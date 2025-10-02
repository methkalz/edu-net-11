-- إنشاء bucket للأفاتارات المخصصة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-avatars', 
  'custom-avatars', 
  true,
  524288, -- 500 KB
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

-- سياسة السماح للمعلمين فقط برفع صور الأفاتار
CREATE POLICY "Teachers can upload custom avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'custom-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- سياسة السماح للجميع بمشاهدة الأفاتارات
CREATE POLICY "Anyone can view custom avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'custom-avatars');

-- سياسة السماح للمعلمين بحذف أفاتاراتهم
CREATE POLICY "Teachers can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'custom-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- سياسة السماح للمعلمين بتحديث أفاتاراتهم
CREATE POLICY "Teachers can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'custom-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);