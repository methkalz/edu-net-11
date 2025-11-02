-- تعديل RLS policy لجدول pdf_comparison_repository
-- للسماح للسوبر أدمن برؤية جميع الملفات

-- حذف الـ policy القديمة
DROP POLICY IF EXISTS "Teachers and admins can view repository in their school" ON pdf_comparison_repository;

-- إنشاء policy جديدة محسّنة
CREATE POLICY "Teachers and admins can view repository in their school"
ON pdf_comparison_repository
FOR SELECT
TO authenticated
USING (
  -- السوبر أدمن يمكنه رؤية كل شيء
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'superadmin'
  ))
  OR
  -- المعلمون والمدراء يمكنهم رؤية ملفات مدرستهم
  (
    school_id = (SELECT profiles.school_id FROM profiles WHERE profiles.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = ANY(ARRAY['teacher', 'school_admin']::app_role[])
    )
  )
);