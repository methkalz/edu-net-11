-- Update loading_settings table to include all Lottie settings
ALTER TABLE public.loading_settings 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS speed DECIMAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS loop BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Ensure RLS is enabled
ALTER TABLE public.loading_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view loading settings" ON public.loading_settings;
DROP POLICY IF EXISTS "Superadmins can manage loading settings" ON public.loading_settings;

-- Create new RLS policies
CREATE POLICY "Anyone can view loading settings"
  ON public.loading_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Superadmins can manage loading settings"
  ON public.loading_settings
  FOR ALL
  USING (get_user_role() = 'superadmin');

-- Ensure there's always one record for global settings
INSERT INTO public.loading_settings (enabled, lottie_data, speed, loop, file_name)
VALUES (false, null, 1.0, true, null)
ON CONFLICT (id) DO NOTHING;