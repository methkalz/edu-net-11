-- إضافة العمود المفقود is_read لجدول grade12_project_comments
DO $$
BEGIN
    -- التحقق من وجود العمود أولاً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grade12_project_comments' 
                   AND column_name = 'is_read') THEN
        ALTER TABLE public.grade12_project_comments 
        ADD COLUMN is_read boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- إنشاء جدول الإشعارات للمعلمين إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.teacher_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL,
    project_id uuid NOT NULL,
    comment_id uuid,
    notification_type text NOT NULL DEFAULT 'new_comment',
    title text NOT NULL,
    message text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- إضافة RLS policies للجدول الجديد
ALTER TABLE public.teacher_notifications ENABLE ROW LEVEL SECURITY;

-- المعلمون يمكنهم مشاهدة إشعاراتهم فقط
CREATE POLICY IF NOT EXISTS "Teachers can view their own notifications" 
ON public.teacher_notifications 
FOR SELECT 
USING (teacher_id = auth.uid());

-- المعلمون يمكنهم تحديث إشعاراتهم (تحديد كمقروء مثلاً)
CREATE POLICY IF NOT EXISTS "Teachers can update their own notifications" 
ON public.teacher_notifications 
FOR UPDATE 
USING (teacher_id = auth.uid());

-- المعلمون يمكنهم حذف إشعاراتهم
CREATE POLICY IF NOT EXISTS "Teachers can delete their own notifications" 
ON public.teacher_notifications 
FOR DELETE 
USING (teacher_id = auth.uid());

-- النظام يمكنه إدراج الإشعارات
CREATE POLICY IF NOT EXISTS "System can create notifications" 
ON public.teacher_notifications 
FOR INSERT 
WITH CHECK (true);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher_id ON public.teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_created_at ON public.teacher_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_is_read ON public.teacher_notifications(is_read);

-- إضافة trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_teacher_notifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER IF NOT EXISTS update_teacher_notifications_updated_at_trigger
    BEFORE UPDATE ON public.teacher_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_teacher_notifications_updated_at();