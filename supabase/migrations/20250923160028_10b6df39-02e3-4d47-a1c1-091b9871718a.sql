-- Fix the main issue with student_activity_log by simplifying the policy
DROP POLICY IF EXISTS "Students can log their own activity" ON public.student_activity_log;

CREATE POLICY "Students can log their own activity"
ON public.student_activity_log
FOR INSERT 
WITH CHECK (student_id = auth.uid());