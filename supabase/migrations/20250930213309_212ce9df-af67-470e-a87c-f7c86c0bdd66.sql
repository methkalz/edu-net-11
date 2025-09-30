
-- تحديث دالة get_student_total_points لتأخذ النقاط من grade11_player_profiles
CREATE OR REPLACE FUNCTION public.get_student_total_points(student_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_grade text;
  grade11_points integer;
BEGIN
  -- Get student's assigned grade
  SELECT get_student_assigned_grade(student_uuid) INTO student_grade;
  
  -- For Grade 11 students, use grade11_player_profiles
  IF student_grade = '11' THEN
    SELECT total_xp INTO grade11_points
    FROM grade11_player_profiles
    WHERE user_id = student_uuid
    LIMIT 1;
    
    -- If found in grade11_player_profiles, return those points
    IF grade11_points IS NOT NULL THEN
      RETURN COALESCE(grade11_points, 0);
    END IF;
  END IF;
  
  -- For other grades or if not found in grade11_player_profiles, use old calculation
  RETURN COALESCE(
    (SELECT SUM(points_earned) FROM public.student_progress WHERE student_id = student_uuid) +
    (SELECT SUM(points_value) FROM public.student_achievements WHERE student_id = student_uuid) +
    (SELECT SUM(points_earned) FROM public.student_activity_log WHERE student_id = student_uuid),
    0
  );
END;
$$;
