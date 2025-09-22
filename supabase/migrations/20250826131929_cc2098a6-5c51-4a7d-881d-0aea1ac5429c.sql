-- إصلاح شامل لمشاكل إضافة مشاريع الصف الثاني عشر

-- حذف السياسات الموجودة وإعادة إنشاؤها بشكل صحيح
DROP POLICY IF EXISTS "Students can create final projects for themselves" ON grade12_final_projects;

-- إنشاء سياسة إدراج مبسطة ومؤقتة للاختبار
CREATE POLICY "Students can create final projects" 
ON grade12_final_projects 
FOR INSERT 
WITH CHECK (
  student_id = auth.uid()
);

-- إضافة سياسة للتحديث
CREATE POLICY "Students can update their final projects" 
ON grade12_final_projects 
FOR UPDATE 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- إضافة سياسة للعرض للطلاب
CREATE POLICY "Students can view their final projects" 
ON grade12_final_projects 
FOR SELECT 
USING (student_id = auth.uid());

-- إضافة سياسة للمعلمين والإدارة
CREATE POLICY "Teachers can manage all final projects in their school" 
ON grade12_final_projects 
FOR ALL 
USING (
  get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND
  (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND
  (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);