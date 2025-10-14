-- تحديث RLS policy لجدول teacher_notifications للسماح بالـ INSERT من الـ triggers
DROP POLICY IF EXISTS "Allow insert from security definer functions" ON teacher_notifications;

CREATE POLICY "Allow insert from triggers and functions"
ON teacher_notifications
FOR INSERT
TO public
WITH CHECK (true);