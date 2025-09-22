-- إصلاح RLS policies ونظام التعليقات - خطوة بخطوة

-- حذف جميع الـ policies بشكل آمن
DROP POLICY IF EXISTS "Students can manage their own project comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "Students can view comments on their projects" ON grade12_project_comments;
DROP POLICY IF EXISTS "Teachers can manage all project comments in their school" ON grade12_project_comments;

-- إنشاء RLS policies جديدة بأسماء فريدة
CREATE POLICY "allow_students_manage_own_comments" 
ON grade12_project_comments 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "allow_students_view_project_comments" 
ON grade12_project_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM grade12_final_projects p 
  JOIN students s ON p.student_id = s.id
  WHERE p.id = grade12_project_comments.project_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "allow_teachers_manage_school_comments" 
ON grade12_project_comments 
FOR ALL 
USING ((get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND EXISTS (
    SELECT 1 FROM grade12_final_projects p 
    WHERE p.id = grade12_project_comments.project_id 
    AND ((p.school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
  ))
WITH CHECK ((get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND created_by = auth.uid());