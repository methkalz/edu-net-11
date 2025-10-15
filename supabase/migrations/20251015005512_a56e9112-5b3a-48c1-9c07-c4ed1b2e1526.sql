
-- إصلاح RLS policies لجدول student_notifications
-- المشكلة: student_id يخزن students.id لكن policy تقارن مع auth.uid()

DROP POLICY IF EXISTS "Students can view their own notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Students can view their notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Students can update their own notifications" ON public.student_notifications;

-- Policy للقراءة: يربط student_id (من جدول students) مع auth.uid()
CREATE POLICY "Students can view their notifications"
ON public.student_notifications
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.students s 
    WHERE s.id = student_notifications.student_id 
    AND s.user_id = auth.uid()
  )
);

-- Policy للتحديث: يربط student_id مع auth.uid()
CREATE POLICY "Students can update their notifications"
ON public.student_notifications
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.students s 
    WHERE s.id = student_notifications.student_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.students s 
    WHERE s.id = student_notifications.student_id 
    AND s.user_id = auth.uid()
  )
);
