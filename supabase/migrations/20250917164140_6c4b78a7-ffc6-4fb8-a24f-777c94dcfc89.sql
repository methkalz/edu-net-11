-- إصلاح التحذيرات الأمنية وإنشاء جداول التعليقات والإشعارات

-- إنشاء جدول التعليقات على مشاريع الصف الثاني عشر
CREATE TABLE IF NOT EXISTS public.grade12_project_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'feedback', 'grade')),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_grade12_project_comments_project FOREIGN KEY (project_id) REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade12_project_comments_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_project_id ON public.grade12_project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_user_id ON public.grade12_project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_created_at ON public.grade12_project_comments(created_at);

-- تفعيل RLS
ALTER TABLE public.grade12_project_comments ENABLE ROW LEVEL SECURITY;

-- سياسات RLS آمنة للتعليقات
DROP POLICY IF EXISTS "أطراف المشروع يمكنهم رؤية التعليقات" ON public.grade12_project_comments;
CREATE POLICY "أطراف المشروع يمكنهم رؤية التعليقات" 
ON public.grade12_project_comments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM grade12_final_projects p 
        WHERE p.id = grade12_project_comments.project_id 
        AND (
            p.student_id = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM profiles pr 
                WHERE pr.user_id = auth.uid() 
                AND pr.role IN ('teacher', 'school_admin', 'superadmin')
                AND (pr.school_id = p.school_id OR pr.role = 'superadmin')
            )
        )
    )
);

DROP POLICY IF EXISTS "أطراف المشروع يمكنهم إضافة تعليقات" ON public.grade12_project_comments;
CREATE POLICY "أطراف المشروع يمكنهم إضافة تعليقات" 
ON public.grade12_project_comments FOR INSERT 
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM grade12_final_projects p 
        WHERE p.id = grade12_project_comments.project_id 
        AND (
            p.student_id = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM profiles pr 
                WHERE pr.user_id = auth.uid() 
                AND pr.role IN ('teacher', 'school_admin', 'superadmin')
                AND (pr.school_id = p.school_id OR pr.role = 'superadmin')
            )
        )
    )
);

DROP POLICY IF EXISTS "أصحاب التعليقات يمكنهم تحديثها" ON public.grade12_project_comments;
CREATE POLICY "أصحاب التعليقات يمكنهم تحديثها" 
ON public.grade12_project_comments FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.grade12_project_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'comment',
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_grade12_project_notifications_project FOREIGN KEY (project_id) REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade12_project_notifications_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_grade12_project_notifications_project_id ON public.grade12_project_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_notifications_user_id ON public.grade12_project_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_notifications_is_read ON public.grade12_project_notifications(is_read);

-- تفعيل RLS
ALTER TABLE public.grade12_project_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات RLS آمنة للإشعارات
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية إشعاراتهم فقط" ON public.grade12_project_notifications;
CREATE POLICY "المستخدمون يمكنهم رؤية إشعاراتهم فقط" 
ON public.grade12_project_notifications FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "النظام يمكنه إضافة الإشعارات" ON public.grade12_project_notifications;
CREATE POLICY "النظام يمكنه إضافة الإشعارات" 
ON public.grade12_project_notifications FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث إشعاراتهم" ON public.grade12_project_notifications;
CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" 
ON public.grade12_project_notifications FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- دالة لتحديث updated_at للتعليقات
CREATE OR REPLACE FUNCTION update_grade12_project_comments_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_grade12_project_comments_updated_at ON public.grade12_project_comments;
CREATE TRIGGER update_grade12_project_comments_updated_at
BEFORE UPDATE ON public.grade12_project_comments
FOR EACH ROW
EXECUTE FUNCTION update_grade12_project_comments_updated_at();