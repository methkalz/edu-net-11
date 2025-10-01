-- إصلاح دالة get_student_dashboard_stats لتتوافق مع التحديثات الأخيرة
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
  WHERE student_id = student_uuid;
  
  -- Get total activities
  SELECT COUNT(*) INTO total_activities
  FROM public.student_activity_log 
  WHERE student_id = student_uuid;
  
  -- Get achievements count
  SELECT COUNT(*) INTO achievements_count
  FROM public.student_achievements 
  WHERE student_id = student_uuid;
  
  -- Calculate current streak (simplified - days with activity)
  SELECT COUNT(DISTINCT DATE(created_at)) INTO current_streak
  FROM public.student_activity_log 
  WHERE student_id = student_uuid 
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