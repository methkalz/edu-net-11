-- تحديث دالة get_student_dashboard_stats لاستخدام get_student_total_points للصف 12
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
  student_grade text;
BEGIN
  -- الحصول على صف الطالب
  SELECT get_student_assigned_grade(student_uuid) INTO student_grade;
  
  -- استخدام get_student_total_points للصف 12 لحساب النقاط بشكل صحيح
  IF student_grade = '12' THEN
    SELECT get_student_total_points(student_uuid) INTO total_points;
  ELSE
    -- للصفوف الأخرى، استخدام النقاط من profiles
    SELECT COALESCE(points, 0) INTO total_points
    FROM public.profiles 
    WHERE user_id = student_uuid;
  END IF;
  
  SELECT 
    COUNT(*) FILTER (WHERE content_type = 'video' AND progress_percentage = 100),
    COUNT(*) FILTER (WHERE content_type = 'project' AND progress_percentage = 100)
  INTO completed_videos, completed_projects
  FROM public.student_progress 
  WHERE student_id = student_uuid;
  
  SELECT COUNT(*) INTO total_activities
  FROM public.student_activity_log 
  WHERE student_id = student_uuid;
  
  SELECT COUNT(*) INTO achievements_count
  FROM public.student_achievements 
  WHERE student_id = student_uuid;
  
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