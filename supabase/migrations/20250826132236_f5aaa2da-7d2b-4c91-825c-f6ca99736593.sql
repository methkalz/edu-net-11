-- إصلاح مشكلة school_id المطلوب في grade12_final_projects

-- تحديث سياسة الإدراج لتكون أكثر مرونة
DROP POLICY IF EXISTS "Students can create final projects" ON grade12_final_projects;

-- إنشاء سياسة جديدة لا تتطلب school_id
CREATE POLICY "Students can create final projects without school requirement" 
ON grade12_final_projects 
FOR INSERT 
WITH CHECK (
  student_id = auth.uid()
);

-- تحديث السياسات الأخرى لتعمل مع أو بدون school_id
DROP POLICY IF EXISTS "Teachers can manage all final projects in their school" ON grade12_final_projects;

CREATE POLICY "Teachers can manage final projects" 
ON grade12_final_projects 
FOR ALL 
USING (
  get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) OR
  student_id = auth.uid()
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) OR
  student_id = auth.uid()
);