-- إنشاء bucket للملفات التعليمية
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-media',
  'lesson-media',
  true,
  524288000, -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies للـ lesson-media bucket
-- السماح للمستخدمين المصادق عليهم برفع الفيديوهات
CREATE POLICY "Authenticated users can upload lesson media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-media');

-- السماح للجميع بقراءة الفيديوهات (لأن الـ bucket عام)
CREATE POLICY "Public read access to lesson media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lesson-media');

-- السماح للمستخدمين بتحديث ملفاتهم الخاصة
CREATE POLICY "Users can update their own lesson media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lesson-media' AND owner = auth.uid())
WITH CHECK (bucket_id = 'lesson-media' AND owner = auth.uid());

-- السماح للمستخدمين بحذف ملفاتهم الخاصة
CREATE POLICY "Users can delete their own lesson media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-media' AND owner = auth.uid());