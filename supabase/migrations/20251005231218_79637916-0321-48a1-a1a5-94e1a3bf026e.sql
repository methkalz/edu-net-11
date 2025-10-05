-- Create table for Zoho Writer integrations
CREATE TABLE public.zoho_writer_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  api_domain TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.zoho_writer_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own integrations
CREATE POLICY "Users can view their own Zoho integrations"
  ON public.zoho_writer_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Zoho integrations"
  ON public.zoho_writer_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Zoho integrations"
  ON public.zoho_writer_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Zoho integrations"
  ON public.zoho_writer_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_zoho_integrations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_zoho_integrations_updated_at
  BEFORE UPDATE ON public.zoho_writer_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_zoho_integrations_updated_at();