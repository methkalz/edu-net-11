-- Create teacher_classes table for teacher-class assignments
CREATE TABLE public.teacher_classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL,
    class_id UUID NOT NULL,
    created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,
    UNIQUE(teacher_id, class_id)
);

-- Enable RLS on teacher_classes
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for teacher_classes
CREATE POLICY "School admins can manage teacher class assignments" 
ON public.teacher_classes 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM classes c 
        WHERE c.id = teacher_classes.class_id 
        AND (
            (c.school_id = get_user_school_id() AND get_user_role() IN ('school_admin', 'superadmin')) 
            OR get_user_role() = 'superadmin'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM classes c 
        WHERE c.id = teacher_classes.class_id 
        AND (
            (c.school_id = get_user_school_id() AND get_user_role() IN ('school_admin', 'superadmin')) 
            OR get_user_role() = 'superadmin'
        )
    )
);

CREATE POLICY "School members can view teacher class assignments" 
ON public.teacher_classes 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM classes c 
        WHERE c.id = teacher_classes.class_id 
        AND (c.school_id = get_user_school_id() OR get_user_role() = 'superadmin')
    )
);

-- Add RLS policy for INSERT on profiles table for school admins
CREATE POLICY "School admins can create teacher profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
    get_user_role() IN ('school_admin', 'superadmin') 
    AND role = 'teacher' 
    AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin')
);