-- Add RLS policy to allow students to view basic teacher profile info in their school
CREATE POLICY "Students can view basic teacher info in their school" 
ON public.profiles 
FOR SELECT 
USING (
  -- Students can view teachers in their school (basic info only)
  (get_user_role() = 'student'::app_role) 
  AND (role = 'teacher'::app_role) 
  AND (school_id = get_user_school_id())
);