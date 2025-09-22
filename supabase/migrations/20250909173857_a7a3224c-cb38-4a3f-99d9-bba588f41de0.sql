-- Add RLS policies for loading_settings table to restrict editing to super admin only

-- Enable RLS if not already enabled
ALTER TABLE public.loading_settings ENABLE ROW LEVEL SECURITY;

-- Allow all users to read Lottie settings (needed for display)
CREATE POLICY "Anyone can view loading settings"
ON public.loading_settings
FOR SELECT
USING (true);

-- Only super admin can insert/update/delete Lottie settings
CREATE POLICY "Super admins can manage loading settings"
ON public.loading_settings
FOR ALL
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);