-- إصلاح RLS policies ونظام التعليقات بالكامل - إصدار محسن

-- حذف الـ triggers والـ functions بـ CASCADE
DROP TRIGGER IF EXISTS notify_project_participants_trigger ON grade12_project_comments;
DROP TRIGGER IF EXISTS trigger_notify_project_participants ON grade12_project_comments;
DROP FUNCTION IF EXISTS notify_project_participants() CASCADE;

-- حذف الـ policies الحالية المعطوبة
DROP POLICY IF EXISTS "Students can manage their project comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "Teachers can view project comments in their school" ON grade12_project_comments;
DROP POLICY IF EXISTS "Project participants can add comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "Project participants can view comments" ON grade12_project_comments;

-- إنشاء RLS policies صحيحة للتعليقات على المشاريع
CREATE POLICY "Students can manage their own project comments" 
ON grade12_project_comments 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Students can view comments on their projects" 
ON grade12_project_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM grade12_final_projects p 
  JOIN students s ON p.student_id = s.id
  WHERE p.id = grade12_project_comments.project_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Teachers can manage all project comments in their school" 
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

-- إنشاء function جديد صحيح للإشعارات
CREATE OR REPLACE FUNCTION notify_project_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_record RECORD;
  commenter_name TEXT;
  commenter_role app_role;
  student_user_id UUID;
BEGIN
  -- جلب معلومات المشروع والطالب
  SELECT 
    p.*,
    s.full_name as student_name,
    s.user_id as student_user_id
  INTO project_record
  FROM grade12_final_projects p
  JOIN students s ON p.student_id = s.id
  WHERE p.id = NEW.project_id;
  
  -- التأكد من وجود المشروع
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- جلب معلومات المعلق
  SELECT full_name, role INTO commenter_name, commenter_role
  FROM profiles WHERE user_id = NEW.created_by;
  
  -- التأكد من وجود المعلق
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  student_user_id := project_record.student_user_id;
  
  -- إشعار الطالب إذا كان المعلق معلماً أو إدارياً
  IF commenter_role = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role]) THEN
    INSERT INTO student_notifications (
      student_id, project_id, comment_id, 
      notification_type, title, message
    ) VALUES (
      student_user_id, NEW.project_id, NEW.id,
      'teacher_comment', 'تعليق جديد من المعلم',
      CONCAT('أضاف ', COALESCE(commenter_name, 'المعلم'), ' تعليقاً على مشروعك "', project_record.title, '"')
    );
  END IF;
  
  -- إشعار المعلمين إذا كان المعلق طالباً
  IF commenter_role = 'student'::app_role THEN
    INSERT INTO teacher_notifications (
      teacher_id, project_id, comment_id,
      notification_type, title, message
    )
    SELECT 
      pr.user_id, NEW.project_id, NEW.id,
      'student_comment', 'تعليق جديد من طالب',
      CONCAT(COALESCE(commenter_name, 'الطالب'), ' أضاف تعليقاً على مشروع "', project_record.title, '"')
    FROM profiles pr
    WHERE pr.school_id = project_record.school_id 
    AND pr.role = 'teacher'::app_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger جديد
CREATE TRIGGER notify_project_participants_trigger
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_participants();

-- التأكد من وجود indexes للأداء
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_project_id ON grade12_project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_created_by ON grade12_project_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_grade12_final_projects_student_id ON grade12_final_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);