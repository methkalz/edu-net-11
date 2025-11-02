-- تعديل RLS policies لجدول pdf_comparison_repository
-- المستودع للسوبر أدمن فقط - المعلمون لا يرون الملفات

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Teachers and admins can view repository in their school" ON pdf_comparison_repository;
DROP POLICY IF EXISTS "Teachers and admins can insert to repository" ON pdf_comparison_repository;

-- السوبر أدمن فقط يمكنه رؤية المستودع
CREATE POLICY "Only superadmin can view repository"
ON pdf_comparison_repository
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
);

-- السوبر أدمن فقط يمكنه الإضافة للمستودع
CREATE POLICY "Only superadmin can insert to repository"
ON pdf_comparison_repository
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
);