-- Create plugin status enum
CREATE TYPE plugin_status AS ENUM (
  'enabled',
  'disabled', 
  'in_development',
  'coming_soon'
);

-- Create plugins table
CREATE TABLE public.plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  default_status plugin_status NOT NULL DEFAULT 'disabled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school_plugins table for managing plugin status per school
CREATE TABLE public.school_plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  plugin_id UUID NOT NULL,
  status plugin_status NOT NULL DEFAULT 'disabled',
  enabled_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, plugin_id)
);

-- Enable RLS
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_plugins ENABLE ROW LEVEL SECURITY;

-- RLS policies for plugins
CREATE POLICY "Anyone can view plugins" 
ON public.plugins 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmins can manage plugins" 
ON public.plugins 
FOR ALL 
USING (get_user_role() = 'superadmin');

-- RLS policies for school_plugins
CREATE POLICY "School admins can view their school plugins" 
ON public.school_plugins 
FOR SELECT 
USING (school_id = get_user_school_id() OR get_user_role() = 'superadmin');

CREATE POLICY "School admins can manage their school plugins" 
ON public.school_plugins 
FOR ALL 
USING ((school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])) OR get_user_role() = 'superadmin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plugins_updated_at
BEFORE UPDATE ON public.plugins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_plugins_updated_at
BEFORE UPDATE ON public.school_plugins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plugins
INSERT INTO public.plugins (name, name_ar, description, description_ar, category, icon, default_status) VALUES
('pdf-checker', 'مدقق ملفات PDF', 'PDF file validation and checking system', 'نظام فحص وتدقيق ملفات PDF', 'tools', 'FileCheck', 'in_development'),
('educational-games', 'ألعاب تعليمية', 'Interactive educational games for students', 'ألعاب تفاعلية تعليمية للطلاب', 'education', 'Gamepad2', 'coming_soon'),
('online-exams', 'امتحانات أونلاين', 'Online examination and assessment system', 'نظام الامتحانات والتقييم الإلكتروني', 'assessment', 'ClipboardCheck', 'enabled'),
('student-labels', 'مُسميّات الطلاب', 'Student name labels and identification system', 'نظام تسميات وتعريف الطلاب', 'management', 'Tag', 'disabled');