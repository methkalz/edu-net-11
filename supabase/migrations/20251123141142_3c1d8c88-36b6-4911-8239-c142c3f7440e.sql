-- Create pdf_comparison_settings table for global customizable settings
CREATE TABLE IF NOT EXISTS public.pdf_comparison_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  thresholds JSONB NOT NULL DEFAULT '{
    "internal_display": 0,
    "repository_display": 35,
    "single_file_display": 30,
    "flagged_threshold": 70,
    "warning_threshold": 40
  }'::jsonb,
  algorithm_weights JSONB NOT NULL DEFAULT '{
    "cosine_weight": 0.50,
    "jaccard_weight": 0.40,
    "length_weight": 0.10,
    "fuzzy_weight": 0.35,
    "sequence_weight": 0.25,
    "structural_weight": 0.15
  }'::jsonb,
  custom_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index on active settings
CREATE INDEX IF NOT EXISTS idx_pdf_settings_active ON public.pdf_comparison_settings(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.pdf_comparison_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active settings
CREATE POLICY "Anyone can read active PDF comparison settings"
  ON public.pdf_comparison_settings
  FOR SELECT
  USING (is_active = true);

-- Policy: Only superadmin can insert
CREATE POLICY "Only superadmin can insert PDF comparison settings"
  ON public.pdf_comparison_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Only superadmin can update
CREATE POLICY "Only superadmin can update PDF comparison settings"
  ON public.pdf_comparison_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Only superadmin can delete
CREATE POLICY "Only superadmin can delete PDF comparison settings"
  ON public.pdf_comparison_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_pdf_comparison_settings_updated_at
  BEFORE UPDATE ON public.pdf_comparison_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.pdf_comparison_settings (
  setting_name,
  thresholds,
  algorithm_weights,
  custom_whitelist,
  is_active
) VALUES (
  'default',
  '{
    "internal_display": 0,
    "repository_display": 35,
    "single_file_display": 30,
    "flagged_threshold": 70,
    "warning_threshold": 40
  }'::jsonb,
  '{
    "cosine_weight": 0.50,
    "jaccard_weight": 0.40,
    "length_weight": 0.10
  }'::jsonb,
  ARRAY['مقدمة', 'خاتمة', 'الفصل', 'الباب', 'القسم', 'المبحث', 'المطلب', 'الفرع', 'أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً'],
  true
) ON CONFLICT (setting_name) DO NOTHING;

-- Create audit log table for settings changes
CREATE TABLE IF NOT EXISTS public.pdf_comparison_settings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID REFERENCES public.pdf_comparison_settings(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.pdf_comparison_settings_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only superadmin can read audit log
CREATE POLICY "Only superadmin can read PDF settings audit log"
  ON public.pdf_comparison_settings_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Function to log settings changes
CREATE OR REPLACE FUNCTION log_pdf_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pdf_comparison_settings_audit (setting_id, changed_by, changes)
  VALUES (
    NEW.id,
    auth.uid(),
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER audit_pdf_settings_changes
  AFTER UPDATE ON public.pdf_comparison_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_pdf_settings_change();