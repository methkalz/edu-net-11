-- حذف trigger القديم تماماً
DROP TRIGGER IF EXISTS notify_project_participants_trigger ON grade12_project_comments CASCADE;

-- حذف الـ function القديمة تماماً  
DROP FUNCTION IF EXISTS notify_project_participants() CASCADE;

-- إنشاء function جديدة محسّنة
CREATE OR REPLACE FUNCTION public.notify_project_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  project_record RECORD;
  commenter_name TEXT;
  commenter_role app_role;
  teacher_record RECORD;
BEGIN
  -- جلب معلومات المشروع
  SELECT * INTO project_record
  FROM grade12_final_projects
  WHERE id = NEW.project_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- جلب معلومات المعلق
  SELECT full_name, role INTO commenter_name, commenter_role
  FROM profiles WHERE user_id = NEW.created_by;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- إشعار الطالب إذا كان المعلق معلماً
  IF commenter_role IN ('teacher', 'school_admin', 'superadmin') THEN
    INSERT INTO student_notifications (
      student_id, project_id, comment_id, 
      notification_type, title, message
    ) VALUES (
      project_record.student_id,
      NEW.project_id, 
      NEW.id,
      'teacher_comment', 
      'تعليق جديد من المعلم',
      CONCAT('أضاف ', COALESCE(commenter_name, 'المعلم'), ' تعليقاً على مشروعك "', project_record.title, '"')
    );
  END IF;
  
  -- إشعار المعلمين إذا كان المعلق طالباً
  IF commenter_role = 'student' THEN
    FOR teacher_record IN
      SELECT pr.user_id
      FROM profiles pr
      WHERE pr.school_id = project_record.school_id 
        AND pr.role = 'teacher'
        AND can_teacher_access_project(pr.user_id, project_record.student_id, 'grade12') = true
    LOOP
      INSERT INTO teacher_notifications (
        teacher_id, project_id, comment_id,
        notification_type, title, message
      ) VALUES (
        teacher_record.user_id, 
        NEW.project_id, 
        NEW.id,
        'student_comment', 
        'تعليق جديد من طالب',
        CONCAT(COALESCE(commenter_name, 'الطالب'), ' أضاف تعليقاً على مشروع "', project_record.title, '"')
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء الـ trigger الجديد
CREATE TRIGGER notify_project_participants_trigger
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_participants();