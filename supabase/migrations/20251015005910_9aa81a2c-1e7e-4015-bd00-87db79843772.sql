-- إصلاح trigger إشعارات التعليقات لاستخدام students.id الصحيح
CREATE OR REPLACE FUNCTION public.create_comment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_project RECORD;
  v_commenter RECORD;
  v_teacher RECORD;
  v_project_type TEXT;
  v_error_msg TEXT;
  v_student_record RECORD;
BEGIN
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
      RAISE NOTICE 'Unknown table: %', TG_TABLE_NAME;
      RETURN NEW;
    END IF;

    -- التحقق من وجود المشروع
    IF NOT FOUND THEN
      RAISE NOTICE 'Project not found for comment %', NEW.id;
      RETURN NEW;
    END IF;

    -- جلب معلومات المعلق
    SELECT full_name, role INTO v_commenter
    FROM profiles
    WHERE user_id = NEW.created_by;

    IF NOT FOUND THEN
      RAISE NOTICE 'Commenter profile not found: %', NEW.created_by;
      RETURN NEW;
    END IF;

    RAISE NOTICE 'Processing comment % by % (role: %)', NEW.id, v_commenter.full_name, v_commenter.role;

    -- إذا كان المعلق طالباً، إشعار المعلمين
    IF v_commenter.role = 'student' THEN
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
        
        RAISE NOTICE 'Created teacher notification for %', v_teacher.user_id;
      END LOOP;
    
    -- إذا كان المعلق معلماً أو مديراً، إشعار الطالب
    ELSIF v_commenter.role IN ('teacher', 'school_admin', 'superadmin') THEN
      -- الحصول على students.id من user_id
      SELECT id INTO v_student_record
      FROM students
      WHERE user_id = v_project.student_id;
      
      IF FOUND THEN
        INSERT INTO student_notifications (
          student_id,
          project_id,
          comment_id,
          notification_type,
          title,
          message
        ) VALUES (
          v_student_record.id,  -- استخدام students.id بدلاً من user_id
          NEW.project_id,
          NEW.id,
          'teacher_comment',
          'تعليق جديد من المعلم',
          CONCAT('أضاف ', COALESCE(v_commenter.full_name, 'المعلم'), ' تعليقاً على مشروعك "', v_project.title, '"')
        );
        
        RAISE NOTICE 'Created student notification for student.id %', v_student_record.id;
      ELSE
        RAISE NOTICE 'Student record not found for user_id %', v_project.student_id;
      END IF;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      RAISE WARNING 'Error in create_comment_notifications: %', v_error_msg;
  END;

  RETURN NEW;
END;
$function$;