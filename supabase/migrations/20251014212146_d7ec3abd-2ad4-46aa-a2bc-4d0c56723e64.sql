-- 🔧 إصلاح نهائي: إنشاء الإشعارات يدوياً للتعليقات المفقودة
-- وإضافة logging للـ trigger

-- 1. إنشاء الإشعارات المفقودة يدوياً
DO $$
DECLARE
  missing_comment RECORD;
  project_info RECORD;
  commenter_info RECORD;
  teacher_rec RECORD;
BEGIN
  -- معالجة التعليقات بدون إشعارات
  FOR missing_comment IN
    SELECT c.*
    FROM grade12_project_comments c
    WHERE c.id NOT IN (
      SELECT comment_id FROM teacher_notifications 
      WHERE comment_id IS NOT NULL
      UNION
      SELECT comment_id FROM student_notifications 
      WHERE comment_id IS NOT NULL
    )
    AND c.created_at > '2025-10-14 21:02:00'
    ORDER BY c.created_at
  LOOP
    -- جلب معلومات المشروع
    SELECT student_id, title, school_id INTO project_info
    FROM grade12_final_projects
    WHERE id = missing_comment.project_id;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    -- جلب معلومات المعلق
    SELECT full_name, role INTO commenter_info
    FROM profiles
    WHERE user_id = missing_comment.created_by;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    -- إنشاء الإشعارات حسب دور المعلق
    IF commenter_info.role = 'student' THEN
      -- إشعار المعلمين
      FOR teacher_rec IN
        SELECT DISTINCT p.user_id
        FROM profiles p
        WHERE p.school_id = project_info.school_id
          AND p.role = 'teacher'
          AND can_teacher_access_project(p.user_id, project_info.student_id, 'grade12') = true
      LOOP
        INSERT INTO teacher_notifications (
          teacher_id,
          project_id,
          comment_id,
          notification_type,
          title,
          message,
          created_at
        ) VALUES (
          teacher_rec.user_id,
          missing_comment.project_id,
          missing_comment.id,
          'new_comment',
          'تعليق جديد من طالب',
          CONCAT(COALESCE(commenter_info.full_name, 'طالب'), ' أضاف تعليقاً على مشروع "', project_info.title, '"'),
          missing_comment.created_at
        );
        
        RAISE NOTICE 'Created notification for teacher % on comment %', teacher_rec.user_id, missing_comment.id;
      END LOOP;
    ELSIF commenter_info.role IN ('teacher', 'school_admin', 'superadmin') THEN
      -- إشعار الطالب
      INSERT INTO student_notifications (
        student_id,
        project_id,
        comment_id,
        notification_type,
        title,
        message,
        created_at
      ) VALUES (
        project_info.student_id,
        missing_comment.project_id,
        missing_comment.id,
        'teacher_comment',
        'تعليق جديد من المعلم',
        CONCAT('أضاف ', COALESCE(commenter_info.full_name, 'المعلم'), ' تعليقاً على مشروعك "', project_info.title, '"'),
        missing_comment.created_at
      );
      
      RAISE NOTICE 'Created notification for student % on comment %', project_info.student_id, missing_comment.id;
    END IF;
  END LOOP;
END $$;

-- 2. إعادة إنشاء الدالة مع إضافة error logging
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
  v_error_msg TEXT;
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
      
      RAISE NOTICE 'Created student notification';
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      RAISE WARNING 'Error in create_comment_notifications: %', v_error_msg;
  END;

  RETURN NEW;
END;
$$;