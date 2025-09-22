-- Create calendar_events table for storing calendar events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  color TEXT DEFAULT '#3b82f6',
  type TEXT DEFAULT 'event' CHECK (type IN ('holiday', 'exam', 'meeting', 'event', 'important', 'deadline', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_settings table for storing calendar display settings
CREATE TABLE public.calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_in_header BOOLEAN DEFAULT false,
  header_duration INTEGER DEFAULT 10 CHECK (header_duration >= 1 AND header_duration <= 60),
  header_color TEXT DEFAULT '#3b82f6',
  auto_show_before_days INTEGER DEFAULT 3 CHECK (auto_show_before_days >= 0 AND auto_show_before_days <= 30),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Superadmins can manage all calendar events"
  ON public.calendar_events FOR ALL
  USING (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "School admins can manage their school events"
  ON public.calendar_events FOR ALL
  USING (
    (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id()) OR
    get_user_role() = 'superadmin'::app_role
  );

CREATE POLICY "Authenticated users can view active calendar events"
  ON public.calendar_events FOR SELECT
  USING (
    is_active = true AND 
    (
      school_id = get_user_school_id() OR 
      school_id IS NULL OR 
      get_user_role() = 'superadmin'::app_role
    )
  );

-- RLS Policies for calendar_settings
CREATE POLICY "Superadmins can manage calendar settings"
  ON public.calendar_settings FOR ALL
  USING (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "Authenticated users can view calendar settings"
  ON public.calendar_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON public.calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_updated_at();

-- Insert default calendar settings
INSERT INTO public.calendar_settings (
  show_in_header,
  header_duration,
  header_color,
  auto_show_before_days,
  is_active
) VALUES (
  false,
  10,
  '#3b82f6',
  3,
  true
);