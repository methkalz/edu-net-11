-- Add INSERT policy for schools table to allow superadmins to create schools
CREATE POLICY "Superadmins can create schools" 
ON public.schools 
FOR INSERT 
WITH CHECK (get_user_role() = 'superadmin'::app_role);