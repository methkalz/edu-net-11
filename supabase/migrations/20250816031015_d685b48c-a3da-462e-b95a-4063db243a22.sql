-- Create packages table
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  duration_days INTEGER, -- null for unlimited
  icon TEXT DEFAULT 'Package',
  color TEXT DEFAULT '#3B82F6',
  gradient TEXT DEFAULT 'gradient-primary',
  is_active BOOLEAN DEFAULT true,
  max_schools INTEGER, -- null for unlimited
  max_students INTEGER, -- null for unlimited
  max_teachers INTEGER, -- null for unlimited
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create package_plugins table (many-to-many relationship)
CREATE TABLE public.package_plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL,
  plugin_id UUID NOT NULL,
  is_included BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_id, plugin_id)
);

-- Create school_packages table (school subscriptions)
CREATE TABLE public.school_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  package_id UUID NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, suspended, cancelled
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE, -- null for unlimited
  auto_renew BOOLEAN DEFAULT false,
  payment_method TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for packages
CREATE POLICY "Anyone can view active packages" 
ON public.packages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Superadmins can manage packages" 
ON public.packages 
FOR ALL 
USING (get_user_role() = 'superadmin');

-- RLS policies for package_plugins
CREATE POLICY "Anyone can view package plugins" 
ON public.package_plugins 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmins can manage package plugins" 
ON public.package_plugins 
FOR ALL 
USING (get_user_role() = 'superadmin');

-- RLS policies for school_packages
CREATE POLICY "Schools can view their packages" 
ON public.school_packages 
FOR SELECT 
USING (school_id = get_user_school_id() OR get_user_role() = 'superadmin');

CREATE POLICY "Superadmins can manage school packages" 
ON public.school_packages 
FOR ALL 
USING (get_user_role() = 'superadmin');

CREATE POLICY "School admins can update their packages" 
ON public.school_packages 
FOR UPDATE 
USING (school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_packages_updated_at
BEFORE UPDATE ON public.school_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default packages
INSERT INTO public.packages (name, name_ar, description, description_ar, price, duration_days, icon, color, gradient, features) VALUES
('Basic Plan', 'الباقة الأساسية', 'Essential features for small schools', 'الميزات الأساسية للمدارس الصغيرة', 29.99, 30, 'Package', '#10B981', 'gradient-emerald', '["إدارة الطلاب الأساسية", "تقارير بسيطة", "دعم فني محدود"]'),
('Pro Plan', 'الباقة الاحترافية', 'Advanced features for growing schools', 'ميزات متقدمة للمدارس النامية', 79.99, 30, 'Crown', '#8B5CF6', 'gradient-purple', '["إدارة متقدمة للطلاب", "تقارير تفصيلية", "إدارة الامتحانات", "دعم فني متقدم"]'),
('Enterprise', 'باقة المؤسسات', 'Complete solution for large institutions', 'حل شامل للمؤسسات الكبيرة', 199.99, null, 'Building', '#F59E0B', 'gradient-gold', '["جميع الميزات", "دعم فني 24/7", "تخصيص كامل", "تدريب مخصص"]');

-- Link plugins to packages
INSERT INTO public.package_plugins (package_id, plugin_id) 
SELECT p.id, pl.id 
FROM public.packages p, public.plugins pl 
WHERE p.name = 'Basic Plan' AND pl.name IN ('online-exams');

INSERT INTO public.package_plugins (package_id, plugin_id) 
SELECT p.id, pl.id 
FROM public.packages p, public.plugins pl 
WHERE p.name = 'Pro Plan' AND pl.name IN ('online-exams', 'student-labels');

INSERT INTO public.package_plugins (package_id, plugin_id) 
SELECT p.id, pl.id 
FROM public.packages p, public.plugins pl 
WHERE p.name = 'Enterprise';