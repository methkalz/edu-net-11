-- Create function to get student's assigned grade
CREATE OR REPLACE FUNCTION public.get_student_assigned_grade(student_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  student_grade text;
BEGIN
  -- Get the grade level for the student based on their class enrollment
  SELECT gl.name INTO student_grade
  FROM public.students s
  JOIN public.class_students cs ON cs.student_id = s.id
  JOIN public.classes c ON c.id = cs.class_id
  JOIN public.grade_levels gl ON gl.id = c.grade_level_id
  WHERE s.user_id = student_user_id
  LIMIT 1;
  
  -- Return the grade level, default to '11' if not found
  RETURN COALESCE(student_grade, '11');
END;
$function$;