-- إصلاح دالة get_student_dashboard_stats بإضافة casting صريح
CREATE OR REPLACE FUNCTION public.get_student_dashboard_stats(student_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_points integer;
  completed_videos integer;
  completed_projects integer;
  current_streak integer;
  total_activities integer;
  achievements_count integer;
BEGIN
  -- Get total points using the updated function
  SELECT get_student_total_points(student_uuid) INTO total_points;
  
  -- Get completed content counts
  SELECT 
    COUNT(*) FILTER (WHERE content_type = 'video' AND progress_percentage = 100),
    COUNT(*) FILTER (WHERE content_type = 'project' AND progress_percentage = 100)
  INTO completed_videos, completed_projects
  FROM public.student_progress 
  WHERE student_id = student_uuid::uuid;
  
  -- Get total activities
  SELECT COUNT(*) INTO total_activities
  FROM public.student_activity_log 
  WHERE student_id = student_uuid::uuid;
  
  -- Get achievements count
  SELECT COUNT(*) INTO achievements_count
  FROM public.student_achievements 
  WHERE student_id = student_uuid::uuid;
  
  -- Calculate current streak (simplified - days with activity)
  SELECT COUNT(DISTINCT DATE(created_at)) INTO current_streak
  FROM public.student_activity_log 
  WHERE student_id = student_uuid::uuid
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  RETURN jsonb_build_object(
    'total_points', COALESCE(total_points, 0),
    'completed_videos', COALESCE(completed_videos, 0),
    'completed_projects', COALESCE(completed_projects, 0),
    'current_streak', COALESCE(current_streak, 0),
    'total_activities', COALESCE(total_activities, 0),
    'achievements_count', COALESCE(achievements_count, 0)
  );
END;
$function$;

-- إصلاح دالة get_student_assigned_grade بإضافة casting صريح
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
  SELECT 
    CASE 
      WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
      WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'  
      WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
      ELSE COALESCE(gl.code, '11')
    END INTO student_grade
  FROM public.students s
  JOIN public.class_students cs ON cs.student_id = s.id
  JOIN public.classes c ON c.id = cs.class_id
  JOIN public.grade_levels gl ON gl.id = c.grade_level_id
  WHERE s.user_id = student_user_id::uuid
  LIMIT 1;
  
  -- Return the grade level, default to '11' if not found
  RETURN COALESCE(student_grade, '11');
END;
$function$;