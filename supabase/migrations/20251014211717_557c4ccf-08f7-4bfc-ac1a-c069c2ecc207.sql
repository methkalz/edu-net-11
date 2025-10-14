-- ============================================
-- نظام إشعارات التعليقات - أفضل الممارسات
-- ============================================

-- 1. إنشاء دالة بسيطة وموثوقة لإنشاء الإشعارات
CREATE OR REPLACE FUNCTION public.create_comment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project RECORD;
  v_commenter RECORD;
  v_teacher RECORD;
  v_project_type TEXT;
BEGIN
  -- تحديد نوع المشروع
  IF TG_TABLE_NAME = 'grade12_project_comments' THEN
    v_project_type := 'grade12';
    SELECT student_id, title, school_id INTO v_project
    FROM grade12_final_projects
    WHERE id = NEW.project_id;
  ELSIF TG_TABLE_NAME = 'grade10_project_comments' THEN
    v_project_type := 'grade10';
    SELECT student_id, title, school_id INTO v_project
    FROM grade10_mini_projects
    WHERE id = NEW.project_id;
  ELSE
    RETURN NEW;
  END IF;

  -- التحقق من وجود المشروع
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- جلب معلومات المعلق
  SELECT full_name, role INTO v_commenter
  FROM profiles
  WHERE user_id = NEW.created_by;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- إذا كان المعلق طالباً، إشعار المعلمين
  IF v_commenter.role = 'student' THEN
    -- جلب جميع المعلمين الذين يمكنهم الوصول للمشروع
    FOR v_teacher IN
      SELECT DISTINCT p.user_id
      FROM profiles p
      WHERE p.school_id = v_project.school_id
        AND p.role = 'teacher'
        AND can_teacher_access_project(p.user_id, v_project.student_id, v_project_type) = true
    LOOP
      INSERT INTO teacher_notifications (
        teacher_id,
        project_id,
        comment_id,
        notification_type,
        title,
        message
      ) VALUES (
        v_teacher.user_id,
        NEW.project_id,
        NEW.id,
        'new_comment',
        'تعليق جديد من طالب',
        CONCAT(COALESCE(v_commenter.full_name, 'طالب'), ' أضاف تعليقاً على مشروع "', v_project.title, '"')
      );
    END LOOP;
  
  -- إذا كان المعلق معلماً أو مديراً، إشعار الطالب
  ELSIF v_commenter.role IN ('teacher', 'school_admin', 'superadmin') THEN
    INSERT INTO student_notifications (
      student_id,
      project_id,
      comment_id,
      notification_type,
      title,
      message
    ) VALUES (
      v_project.student_id,
      NEW.project_id,
      NEW.id,
      'teacher_comment',
      'تعليق جديد من المعلم',
      CONCAT('أضاف ', COALESCE(v_commenter.full_name, 'المعلم'), ' تعليقاً على مشروعك "', v_project.title, '"')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. حذف الـ triggers القديمة إن وجدت
DROP TRIGGER IF EXISTS notify_on_grade12_comment ON grade12_project_comments;
DROP TRIGGER IF EXISTS notify_on_grade10_comment ON grade10_project_comments;

-- 3. إنشاء triggers جديدة
CREATE TRIGGER notify_on_grade12_comment
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();

CREATE TRIGGER notify_on_grade10_comment
  AFTER INSERT ON grade10_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();

-- 4. التأكد من تفعيل Realtime للإشعارات
ALTER TABLE teacher_notifications REPLICA IDENTITY FULL;
ALTER TABLE student_notifications REPLICA IDENTITY FULL;

-- إضافة الجداول إلى publication للـ Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'teacher_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE teacher_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'student_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_notifications;
  END IF;
END $$;