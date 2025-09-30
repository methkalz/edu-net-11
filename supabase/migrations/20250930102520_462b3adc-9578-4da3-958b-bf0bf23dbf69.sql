-- تحديث دالة تتبع الطلاب - إزالة شرط is_active غير الموجود
CREATE OR REPLACE FUNCTION get_teacher_student_tracking(teacher_user_id UUID, teacher_school_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  total_time_minutes INTEGER,
  videos_watched INTEGER,
  documents_read INTEGER,
  lessons_completed INTEGER,
  projects_completed INTEGER,
  games_played INTEGER,
  total_points INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH student_list AS (
    SELECT s.id, s.user_id, s.full_name, s.email
    FROM public.students s
    WHERE s.school_id = teacher_school_id
      AND s.user_id IS NOT NULL
  ),
  progress_stats AS (
    SELECT 
      sp.student_id,
      SUM(sp.time_spent_minutes) as time_from_progress,
      SUM(sp.points_earned) as points_from_progress,
      SUM(CASE WHEN sp.content_type = 'video' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END) as videos,
      SUM(CASE WHEN sp.content_type = 'document' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END) as documents,
      SUM(CASE WHEN sp.content_type = 'lesson' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END) as lessons,
      SUM(CASE WHEN sp.content_type = 'project' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END) as projects
    FROM public.student_progress sp
    WHERE sp.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sp.student_id
  ),
  activity_stats AS (
    SELECT 
      sa.student_id,
      SUM(sa.duration_seconds) / 60 as time_from_activities,
      SUM(sa.points_earned) as points_from_activities,
      SUM(CASE WHEN sa.activity_type = 'game_play' THEN 1 ELSE 0 END) as games,
      MAX(sa.created_at) as last_activity_time
    FROM public.student_activity_log sa
    WHERE sa.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sa.student_id
  ),
  achievement_stats AS (
    SELECT 
      sach.student_id,
      SUM(sach.points_value) as points_from_achievements
    FROM public.student_achievements sach
    WHERE sach.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sach.student_id
  )
  SELECT 
    sl.id as student_id,
    sl.full_name as student_name,
    COALESCE(sl.email, '') as student_email,
    COALESCE(ps.time_from_progress, 0) + COALESCE(ast.time_from_activities, 0) as total_time_minutes,
    COALESCE(ps.videos, 0)::INTEGER as videos_watched,
    COALESCE(ps.documents, 0)::INTEGER as documents_read,
    COALESCE(ps.lessons, 0)::INTEGER as lessons_completed,
    COALESCE(ps.projects, 0)::INTEGER as projects_completed,
    COALESCE(ast.games, 0)::INTEGER as games_played,
    COALESCE(ps.points_from_progress, 0) + COALESCE(ast.points_from_activities, 0) + COALESCE(acs.points_from_achievements, 0) as total_points,
    ast.last_activity_time as last_activity
  FROM student_list sl
  LEFT JOIN progress_stats ps ON ps.student_id = sl.user_id
  LEFT JOIN activity_stats ast ON ast.student_id = sl.user_id
  LEFT JOIN achievement_stats acs ON acs.student_id = sl.user_id
  ORDER BY sl.full_name;
END;
$$;