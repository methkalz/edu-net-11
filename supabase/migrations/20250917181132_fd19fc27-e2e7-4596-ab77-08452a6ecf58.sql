-- إصلاح RLS policies لجدول grade12_project_comments
-- إضافة policy للسماح للطلاب بإضافة تعليقات على مشاريعهم
CREATE POLICY "Students can add comments to their projects" ON grade12_project_comments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM grade12_final_projects p
    WHERE p.id = grade12_project_comments.project_id 
    AND p.student_id = auth.uid()
  )
);

-- إضافة policy للسماح للمعلمين بإضافة تعليقات على مشاريع مدرستهم
CREATE POLICY "Teachers can add comments to school projects" ON grade12_project_comments
FOR INSERT WITH CHECK (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
  AND EXISTS (
    SELECT 1 FROM grade12_final_projects p
    WHERE p.id = grade12_project_comments.project_id 
    AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- إنشاء جدول إشعارات الطلاب إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  project_id UUID REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES grade12_project_comments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'teacher_comment',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS لجدول إشعارات الطلاب
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- إنشاء policies لجدول إشعارات الطلاب
CREATE POLICY "Students can view their own notifications" ON student_notifications
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update their own notifications" ON student_notifications
FOR UPDATE USING (student_id = auth.uid());

-- إنشاء trigger للإشعارات عند إضافة تعليقات جديدة
CREATE OR REPLACE FUNCTION notify_project_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
  commenter_name TEXT;
  commenter_role app_role;
BEGIN
  -- جلب معلومات المشروع والطالب
  SELECT p.*, s.full_name as student_name, s.user_id as student_user_id
  INTO project_record
  FROM grade12_final_projects p
  LEFT JOIN students s ON p.student_id = s.id
  WHERE p.id = NEW.project_id;
  
  -- جلب معلومات المعلق
  SELECT full_name, role INTO commenter_name, commenter_role
  FROM profiles WHERE user_id = NEW.created_by;
  
  -- إشعار الطالب إذا كان المعلق معلماً
  IF commenter_role = 'teacher'::app_role OR commenter_role = 'school_admin'::app_role THEN
    INSERT INTO student_notifications (
      student_id, project_id, comment_id, 
      notification_type, title, message
    ) VALUES (
      project_record.student_user_id, NEW.project_id, NEW.id,
      'teacher_comment', 'تعليق جديد من المعلم',
      CONCAT('أضاف ', commenter_name, ' تعليقاً على مشروعك "', project_record.title, '"')
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
      CONCAT(commenter_name, ' أضاف تعليقاً على مشروع "', project_record.title, '"')
    FROM profiles pr
    WHERE pr.school_id = project_record.school_id 
    AND pr.role = 'teacher'::app_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ربط الـ trigger بجدول التعليقات
DROP TRIGGER IF EXISTS trigger_notify_project_participants ON grade12_project_comments;
CREATE TRIGGER trigger_notify_project_participants
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_participants();

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_student_notifications_student_id ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_project_id ON student_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_project_id ON grade12_project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_created_by ON grade12_project_comments(created_by);