-- Create teacher_classes table to assign teachers to classes
CREATE TABLE public.teacher_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- Enable RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_classes
CREATE POLICY "School admins can manage their school teacher classes" 
ON public.teacher_classes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.id = teacher_classes.class_id 
    AND ((c.school_id = get_user_school_id() AND get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
         OR get_user_role() = 'superadmin'::app_role)
  )
);

CREATE POLICY "School members can view their school teacher classes" 
ON public.teacher_classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.id = teacher_classes.class_id 
    AND (c.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_teacher_classes_updated_at
BEFORE UPDATE ON public.teacher_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();