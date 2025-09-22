-- إضافة RLS policies لجدول teacher_notifications
CREATE POLICY "Teachers can view their own notifications"
ON public.teacher_notifications
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own notifications"
ON public.teacher_notifications
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.teacher_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- إنشاء trigger لإشعار المعلمين تلقائياً عند إضافة تعليق من طالب
CREATE OR REPLACE FUNCTION public.create_teacher_notification_on_student_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  project_record RECORD;
  teacher_record RECORD;
  student_name TEXT;
BEGIN
  -- الحصول على معلومات المشروع
  SELECT * INTO project_record
  FROM grade12_final_projects 
  WHERE id = NEW.project_id;
  
  -- الحصول على اسم الطالب
  SELECT full_name INTO student_name
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- التحقق من أن التعليق من طالب وليس من معلم
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.user_id AND role = 'student') THEN
    -- الحصول على معلمي المدرسة
    FOR teacher_record IN 
      SELECT user_id 
      FROM profiles 
      WHERE school_id = project_record.school_id 
      AND role = 'teacher'
    LOOP
      -- إنشاء إشعار للمعلم
      INSERT INTO teacher_notifications (
        teacher_id,
        project_id,
        comment_id,
        notification_type,
        title,
        message
      ) VALUES (
        teacher_record.user_id,
        NEW.project_id,
        NEW.id,
        'new_comment',
        'تعليق جديد على مشروع',
        CONCAT(COALESCE(student_name, 'طالب'), ' أضاف تعليقاً جديداً على مشروع "', COALESCE(project_record.title, 'مشروع'), '"')
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ربط الـ trigger بجدول التعليقات
DROP TRIGGER IF EXISTS trigger_create_teacher_notification ON grade12_project_comments;
CREATE TRIGGER trigger_create_teacher_notification
    AFTER INSERT ON grade12_project_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.create_teacher_notification_on_student_comment();