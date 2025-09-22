-- Create table for admin access PINs
CREATE TABLE public.admin_access_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_pins ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access pins
CREATE POLICY "Only superadmins can manage access PINs"
ON public.admin_access_pins
FOR ALL
USING (get_user_role() = 'superadmin'::app_role)
WITH CHECK (get_user_role() = 'superadmin'::app_role);

-- Create index for faster PIN lookup
CREATE INDEX idx_admin_access_pins_pin_code ON public.admin_access_pins(pin_code);
CREATE INDEX idx_admin_access_pins_expires_at ON public.admin_access_pins(expires_at);

-- Function to clean up expired PINs
CREATE OR REPLACE FUNCTION cleanup_expired_pins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.admin_access_pins 
  WHERE expires_at < now() OR (is_used = true AND used_at < now() - interval '1 hour');
END;
$$;

-- Update function for timestamps
CREATE TRIGGER update_admin_access_pins_updated_at
BEFORE UPDATE ON public.admin_access_pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();