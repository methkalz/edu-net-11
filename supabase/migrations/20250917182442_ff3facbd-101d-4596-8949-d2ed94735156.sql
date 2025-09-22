-- تنظيف جميع RLS policies القديمة والجديدة وإنشاء policies بسيطة وواضحة

-- حذف جميع الـ policies الموجودة
DROP POLICY IF EXISTS "Students can add comments to their projects" ON grade12_project_comments;
DROP POLICY IF EXISTS "Teachers can add comments to school projects" ON grade12_project_comments;  
DROP POLICY IF EXISTS "Teachers can manage comments in their school" ON grade12_project_comments;
DROP POLICY IF EXISTS "Teachers can mark comments as read" ON grade12_project_comments;
DROP POLICY IF EXISTS "students_manage_own_comments_v2" ON grade12_project_comments;
DROP POLICY IF EXISTS "students_view_their_project_comments_v2" ON grade12_project_comments;
DROP POLICY IF EXISTS "teachers_manage_school_comments_v2" ON grade12_project_comments;

-- إنشاء policies بسيطة وواضحة
-- Policy 1: المستخدمون يمكنهم إضافة تعليقات
CREATE POLICY "allow_insert_comments" 
ON grade12_project_comments 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Policy 2: المستخدمون يمكنهم رؤية التعليقات إذا كانت لهم أو إذا كان لديهم وصول للمشروع
CREATE POLICY "allow_select_comments" 
ON grade12_project_comments 
FOR SELECT 
USING (
  -- يمكن للمستخدم رؤية تعليقاته الخاصة
  created_by = auth.uid() 
  OR 
  -- أو يمكن للطالب رؤية تعليقات مشروعه
  EXISTS (
    SELECT 1 FROM grade12_final_projects p 
    WHERE p.id = grade12_project_comments.project_id 
    AND p.student_id = auth.uid()
  )
  OR
  -- أو يمكن للمعلمين رؤية تعليقات مشاريع مدرستهم
  (
    get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
    AND EXISTS (
      SELECT 1 FROM grade12_final_projects p 
      WHERE p.id = grade12_project_comments.project_id 
      AND ((p.school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
    )
  )
);

-- Policy 3: المستخدمون يمكنهم تحديث تعليقاتهم الخاصة
CREATE POLICY "allow_update_own_comments" 
ON grade12_project_comments 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 4: المستخدمون يمكنهم حذف تعليقاتهم الخاصة
CREATE POLICY "allow_delete_own_comments" 
ON grade12_project_comments 
FOR DELETE 
USING (created_by = auth.uid());