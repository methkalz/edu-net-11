-- إنشاء جدول إعدادات المضامين التعليمية للمعلمين
CREATE TABLE public.teacher_content_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  restrict_to_assigned_grades BOOLEAN NOT NULL DEFAULT true,
  allow_cross_grade_access BOOLEAN NOT NULL DEFAULT false,
  show_all_package_content BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one setting per school
  UNIQUE(school_id)
);

-- Enable RLS
ALTER TABLE public.teacher_content_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "School admins can manage their school content settings"
ON public.teacher_content_settings
FOR ALL
USING (
  (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id()) 
  OR (get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "Users can view their school content settings"
ON public.teacher_content_settings
FOR SELECT
USING (
  school_id = get_user_school_id() 
  OR (get_user_role() = 'superadmin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_teacher_content_settings_updated_at
BEFORE UPDATE ON public.teacher_content_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default settings for existing schools
INSERT INTO public.teacher_content_settings (school_id, restrict_to_assigned_grades, created_by)
SELECT 
  s.id as school_id,
  true as restrict_to_assigned_grades,
  (SELECT user_id FROM public.profiles WHERE role = 'superadmin' LIMIT 1) as created_by
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_content_settings tcs 
  WHERE tcs.school_id = s.id
);

-- إنشاء view لاستخراج الصفوف المخصصة للمعلم
CREATE OR REPLACE VIEW public.teacher_assigned_grades AS
SELECT DISTINCT 
  tc.teacher_id,
  gl.id as grade_level_id,
  gl.label as grade_level_label,
  c.school_id
FROM public.teacher_classes tc
JOIN public.classes c ON c.id = tc.class_id
JOIN public.grade_levels gl ON gl.id = c.grade_level_id
WHERE c.status = 'active';

-- دالة للحصول على الصفوف المخصصة للمعلم
CREATE OR REPLACE FUNCTION public.get_teacher_assigned_grade_levels(teacher_user_id UUID)
RETURNS TEXT[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT grade_level_label)
  FROM public.teacher_assigned_grades
  WHERE teacher_id = teacher_user_id;
$$;

-- دالة للتحقق من إعدادات المدرسة للمضامين
CREATE OR REPLACE FUNCTION public.get_school_content_settings(school_uuid UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'restrict_to_assigned_grades', COALESCE(tcs.restrict_to_assigned_grades, true),
    'allow_cross_grade_access', COALESCE(tcs.allow_cross_grade_access, false),
    'show_all_package_content', COALESCE(tcs.show_all_package_content, false)
  )
  FROM public.teacher_content_settings tcs
  WHERE tcs.school_id = school_uuid
  UNION ALL
  SELECT jsonb_build_object(
    'restrict_to_assigned_grades', true,
    'allow_cross_grade_access', false,
    'show_all_package_content', false
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.teacher_content_settings tcs2 
    WHERE tcs2.school_id = school_uuid
  )
  LIMIT 1;
$$;