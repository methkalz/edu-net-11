-- تبسيط RLS policies على teacher_notifications
-- حذف الـ policy المعقدة التي تمنع ظهور الإشعارات
DROP POLICY IF EXISTS "Teachers can view their notifications" ON public.teacher_notifications;

-- الـ policy البسيطة موجودة بالفعل وستبقى:
-- "Teachers can view their own notifications" (teacher_id = auth.uid())

-- التأكد من وجود الـ policy البسيطة (إنشاؤها إذا لم تكن موجودة)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teacher_notifications' 
    AND policyname = 'Teachers can view their own notifications'
  ) THEN
    CREATE POLICY "Teachers can view their own notifications"
    ON public.teacher_notifications
    FOR SELECT
    USING (teacher_id = auth.uid());
  END IF;
END $$;