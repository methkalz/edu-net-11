-- إصلاح trigger الإشعارات ليعمل مع هيكل البيانات الصحيح
DROP TRIGGER IF EXISTS notify_project_participants_trigger ON grade12_project_comments;
DROP FUNCTION IF EXISTS notify_project_participants() CASCADE;

-- إنشاء function محدث للإشعارات
CREATE OR REPLACE FUNCTION notify_project_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
  commenter_name TEXT;
  commenter_role app_role;
BEGIN
  -- جلب معلومات المشروع - student_id يشير إلى user_id مباشرة
  SELECT 
    p.*
  INTO project_record
  FROM grade12_final_projects p
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
  
  -- إشعار الطالب إذا كان المعلق معلماً أو إدارياً
  IF commenter_role = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role]) THEN
    INSERT INTO student_notifications (
      student_id, project_id, comment_id, 
      notification_type, title, message
    ) VALUES (
      project_record.student_id, -- هذا هو user_id الطالب
      NEW.project_id, 
      NEW.id,
      'teacher_comment', 
      'تعليق جديد من المعلم',
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