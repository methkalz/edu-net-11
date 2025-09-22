-- إصلاح RLS policies بناءً على هيكل البيانات الصحيح

-- حذف الـ policies الحالية
DROP POLICY IF EXISTS "allow_students_manage_own_comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "allow_students_view_project_comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "allow_teachers_manage_school_comments" ON grade12_project_comments;

-- إنشاء RLS policies صحيحة - student_id في المشاريع يشير إلى user_id مباشرة
CREATE POLICY "students_manage_own_comments_v2" 
ON grade12_project_comments 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "students_view_their_project_comments_v2" 
ON grade12_project_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM grade12_final_projects p 
  WHERE p.id = grade12_project_comments.project_id 
  AND p.student_id = auth.uid()
));

CREATE POLICY "teachers_manage_school_comments_v2" 
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