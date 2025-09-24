-- جعل bucket grade11-documents عام لعرض الصور بدون مشاكل
UPDATE storage.buckets 
SET public = true 
WHERE id = 'grade11-documents';