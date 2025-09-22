-- Fix RLS policies for schools table to allow superadmins to see all schools
DROP POLICY IF EXISTS "Users can view their school" ON public.schools;

CREATE POLICY "Users can view their school or superadmins can view all" 
ON public.schools 
FOR SELECT 
USING (
  (id = get_user_school_id()) OR 
  (get_user_role() = 'superadmin'::app_role)
);