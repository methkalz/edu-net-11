-- إضافة حقل is_read لجدول grade12_project_comments
ALTER TABLE public.grade12_project_comments 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- إنشاء جدول teacher_notifications
CREATE TABLE public.teacher_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.grade12_final_projects(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.grade12_project_comments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'new_comment',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.teacher_notifications ENABLE ROW LEVEL SECURITY;

-- إضافة policies للإشعارات
CREATE POLICY "Teachers can view their own notifications" 
ON public.teacher_notifications 
FOR SELECT 
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own notifications" 
ON public.teacher_notifications 
FOR UPDATE 
USING (teacher_id = auth.uid());

-- إضافة policy للتعليقات مع حقل is_read
CREATE POLICY "Teachers can mark comments as read" 
ON public.grade12_project_comments 
FOR UPDATE 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
  AND EXISTS (
    SELECT 1 FROM grade12_final_projects p 
    WHERE p.id = grade12_project_comments.project_id 
    AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- إنشاء trigger لإنشاء إشعارات تلقائية عند إضافة تعليق من طالب
CREATE OR REPLACE FUNCTION create_teacher_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  teacher_record RECORD;
  student_name TEXT;
BEGIN
  -- الحصول على معلومات المشروع
  SELECT * INTO project_record
  FROM grade12_final_projects 
  WHERE id = NEW.project_id;
  
  -- التحقق من أن التعليق من طالب وليس من معلم
  IF get_user_role() = 'student'::app_role THEN
    -- الحصول على اسم الطالب
    SELECT full_name INTO student_name
    FROM profiles 
    WHERE user_id = NEW.user_id;
    
    -- الحصول على معلمي المدرسة
    FOR teacher_record IN 
      SELECT user_id 
      FROM profiles 
      WHERE school_id = project_record.school_id 
      AND role = 'teacher'::app_role
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
        CONCAT(student_name, ' أضاف تعليقاً جديداً على مشروع "', project_record.title, '"')
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger
CREATE TRIGGER create_teacher_notification_trigger
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_notification();