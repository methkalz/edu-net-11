-- Fix RLS policies for students table to allow service role access
DROP POLICY IF EXISTS "Service role bypass for students" ON public.students;
CREATE POLICY "Service role bypass for students" 
ON public.students 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update RLS policies for class_students to ensure proper access
DROP POLICY IF EXISTS "Service role bypass for class_students" ON public.class_students;
CREATE POLICY "Service role bypass for class_students" 
ON public.class_students 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Ensure students table has proper indexes
CREATE INDEX IF NOT EXISTS idx_students_school_email ON public.students(school_id, email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);