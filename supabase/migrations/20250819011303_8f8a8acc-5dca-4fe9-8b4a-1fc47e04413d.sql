-- Add RLS policy for INSERT on profiles table for school admins to create teacher profiles
CREATE POLICY "School admins can create teacher profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
    get_user_role() IN ('school_admin', 'superadmin') 
    AND role = 'teacher' 
    AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin')
);