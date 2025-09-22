-- إصلاح سياسات الأمان لجدول grade12_final_projects

-- حذف السياسة الخاطئة للإدراج
DROP POLICY IF EXISTS "Students can create final projects for themselves" ON grade12_final_projects;

-- إنشاء سياسة صحيحة للإدراج
CREATE POLICY "Students can create final projects for themselves" 
ON grade12_final_projects 
FOR INSERT 
WITH CHECK (
  (student_id = auth.uid()) AND 
  (school_id = get_user_school_id())
);