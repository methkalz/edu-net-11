-- Fix RLS policies for whiteboards table to allow superadmins and school admins

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Teachers can create their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Teachers can update their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Teachers can delete their whiteboards" ON public.whiteboards;

-- Create new comprehensive policies

-- SELECT policy: Users can view their own whiteboards OR superadmins can view all
CREATE POLICY "Users can view their whiteboards"
ON public.whiteboards
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR get_user_role() = 'superadmin'::app_role
);

-- INSERT policy: Allow teachers, school_admins, and superadmins to create whiteboards
CREATE POLICY "Authorized users can create whiteboards"
ON public.whiteboards
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
);

-- UPDATE policy: Users can update their own whiteboards OR superadmins can update all
CREATE POLICY "Users can update their whiteboards"
ON public.whiteboards
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR get_user_role() = 'superadmin'::app_role
);

-- DELETE policy: Users can delete their own whiteboards OR superadmins can delete all
CREATE POLICY "Users can delete their whiteboards"
ON public.whiteboards
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR get_user_role() = 'superadmin'::app_role
);