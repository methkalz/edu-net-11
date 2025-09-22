-- إنشاء جداول التعليقات والإشعارات بطريقة مبسطة

-- إنشاء جدول التعليقات على مشاريع الصف الثاني عشر
CREATE TABLE IF NOT EXISTS public.grade12_project_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'feedback', 'grade')),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهارس
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_project_id ON public.grade12_project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_user_id ON public.grade12_project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_comments_created_at ON public.grade12_project_comments(created_at);

-- تفعيل RLS للتعليقات
ALTER TABLE public.grade12_project_comments ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للتعليقات
CREATE POLICY "grade12_comments_read_policy" 
ON public.grade12_project_comments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM grade12_final_projects p 
        WHERE p.id = grade12_project_comments.project_id 
        AND (p.student_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
);

CREATE POLICY "grade12_comments_insert_policy" 
ON public.grade12_project_comments FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "grade12_comments_update_policy" 
ON public.grade12_project_comments FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.grade12_project_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'comment',
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهارس للإشعارات
CREATE INDEX IF NOT EXISTS idx_grade12_project_notifications_project_id ON public.grade12_project_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_notifications_user_id ON public.grade12_project_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_grade12_project_notifications_is_read ON public.grade12_project_notifications(is_read);

-- تفعيل RLS للإشعارات
ALTER TABLE public.grade12_project_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للإشعارات
CREATE POLICY "grade12_notifications_read_policy" 
ON public.grade12_project_notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "grade12_notifications_insert_policy" 
ON public.grade12_project_notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "grade12_notifications_update_policy" 
ON public.grade12_project_notifications FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());