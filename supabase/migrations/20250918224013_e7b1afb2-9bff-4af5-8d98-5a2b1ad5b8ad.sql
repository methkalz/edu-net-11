-- إضافة RLS policies للجداول الجديدة وتحسين الأمان

-- تحديث RLS policies لجدول teacher_notifications
DROP POLICY IF EXISTS "Teachers can view their notifications" ON public.teacher_notifications;
CREATE POLICY "Teachers can view their notifications"
ON public.teacher_notifications
FOR SELECT
USING (
  teacher_id = auth.uid()
  AND (
    -- تحقق من أن المعلم مصرح له بالوصول للمشروع
    EXISTS (
      SELECT 1 FROM public.grade12_final_projects p
      WHERE p.id = teacher_notifications.project_id
      AND can_teacher_access_project(auth.uid(), p.student_id, 'grade12')
    )
    OR
    -- أو تحقق من مشاريع الصف العاشر
    EXISTS (
      SELECT 1 FROM public.grade10_mini_projects p
      WHERE p.id = teacher_notifications.project_id
      AND can_teacher_access_project(auth.uid(), p.student_id, 'grade10')
    )
  )
);

-- إضافة policy للتحديث والحذف
DROP POLICY IF EXISTS "Teachers can update their notifications" ON public.teacher_notifications;
CREATE POLICY "Teachers can update their notifications"
ON public.teacher_notifications
FOR UPDATE
USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can delete their notifications" ON public.teacher_notifications;
CREATE POLICY "Teachers can delete their notifications"
ON public.teacher_notifications
FOR DELETE
USING (teacher_id = auth.uid());

-- تحديث RLS policies لجدول student_notifications
DROP POLICY IF EXISTS "Students can view their notifications" ON public.student_notifications;
CREATE POLICY "Students can view their notifications"
ON public.student_notifications
FOR SELECT
USING (student_id = auth.uid());

-- تحديث RLS policies لجدول grade12_project_comments
DROP POLICY IF EXISTS "Teachers can view project comments in their authorized scope" ON public.grade12_project_comments;
CREATE POLICY "Teachers can view project comments in their authorized scope"
ON public.grade12_project_comments
FOR SELECT
USING (
  -- طلاب يمكنهم رؤية تعليقات مشاريعهم
  (
    get_user_role() = 'student'::app_role 
    AND EXISTS (
      SELECT 1 FROM public.grade12_final_projects p
      WHERE p.id = grade12_project_comments.project_id
      AND p.student_id = auth.uid()
    )
  )
  OR
  -- معلمين يمكنهم رؤية تعليقات المشاريع المصرح لهم بها
  (
    get_user_role() = 'teacher'::app_role
    AND EXISTS (
      SELECT 1 FROM public.grade12_final_projects p
      WHERE p.id = grade12_project_comments.project_id
      AND can_teacher_access_project(auth.uid(), p.student_id, 'grade12')
    )
  )
  OR
  -- إداريين
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
);

-- تحديث RLS policies لجدول grade10_project_comments
DROP POLICY IF EXISTS "Teachers can view grade10 project comments in their authorized scope" ON public.grade10_project_comments;
CREATE POLICY "Teachers can view grade10 project comments in their authorized scope"
ON public.grade10_project_comments
FOR SELECT
USING (
  -- طلاب يمكنهم رؤية تعليقات مشاريعهم
  (
    get_user_role() = 'student'::app_role 
    AND EXISTS (
      SELECT 1 FROM public.grade10_mini_projects p
      WHERE p.id = grade10_project_comments.project_id
      AND p.student_id = auth.uid()
    )
  )
  OR
  -- معلمين يمكنهم رؤية تعليقات المشاريع المصرح لهم بها
  (
    get_user_role() = 'teacher'::app_role
    AND EXISTS (
      SELECT 1 FROM public.grade10_mini_projects p
      WHERE p.id = grade10_project_comments.project_id
      AND can_teacher_access_project(auth.uid(), p.student_id, 'grade10')
    )
  )
  OR
  -- إداريين
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
);

-- تحديث دالة notify_project_participants لتتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.notify_project_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  project_record RECORD;
  commenter_name TEXT;
  commenter_role app_role;
  teacher_record RECORD;
BEGIN
  -- تحديد نوع المشروع وجلب معلوماته
  IF TG_TABLE_NAME = 'grade12_project_comments' THEN
    -- جلب معلومات مشروع الصف الثاني عشر
    SELECT p.* INTO project_record
    FROM grade12_final_projects p
    WHERE p.id = NEW.project_id;
  ELSIF TG_TABLE_NAME = 'grade10_project_comments' THEN
    -- جلب معلومات مشروع الصف العاشر
    SELECT p.* INTO project_record
    FROM grade10_mini_projects p
    WHERE p.id = NEW.project_id;
  ELSE
    RETURN NEW;
  END IF;
  
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
      project_record.student_id,
      NEW.project_id, 
      NEW.id,
      'teacher_comment', 
      'تعليق جديد من المعلم',
      CONCAT('أضاف ', COALESCE(commenter_name, 'المعلم'), ' تعليقاً على مشروعك "', project_record.title, '"')
    );
  END IF;
  
  -- إشعار المعلمين المصرح لهم إذا كان المعلق طالباً
  IF commenter_role = 'student'::app_role THEN
    -- إشعار المعلمين المصرح لهم فقط
    FOR teacher_record IN
      SELECT pr.user_id
      FROM profiles pr
      WHERE pr.school_id = project_record.school_id 
      AND pr.role = 'teacher'::app_role
      AND can_teacher_access_project(pr.user_id, project_record.student_id, 
          CASE WHEN TG_TABLE_NAME = 'grade12_project_comments' THEN 'grade12' ELSE 'grade10' END
      )
    LOOP
      INSERT INTO teacher_notifications (
        teacher_id, project_id, comment_id,
        notification_type, title, message
      ) VALUES (
        teacher_record.user_id, NEW.project_id, NEW.id,
        'student_comment', 'تعليق جديد من طالب',
        CONCAT(COALESCE(commenter_name, 'الطالب'), ' أضاف تعليقاً على مشروع "', project_record.title, '"')
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- إضافة triggers للدالة الجديدة
DROP TRIGGER IF EXISTS notify_grade12_project_participants ON public.grade12_project_comments;
CREATE TRIGGER notify_grade12_project_participants
  AFTER INSERT ON public.grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_participants();

DROP TRIGGER IF EXISTS notify_grade10_project_participants ON public.grade10_project_comments;
CREATE TRIGGER notify_grade10_project_participants
  AFTER INSERT ON public.grade10_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_participants();