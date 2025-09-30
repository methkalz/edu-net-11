-- إعادة إنشاء دالة تتبع الطلاب مع تطابق كامل للأنواع
DROP FUNCTION IF EXISTS get_teacher_student_tracking(UUID, UUID);

CREATE FUNCTION get_teacher_student_tracking(teacher_user_id UUID, teacher_school_id UUID)
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
      COALESCE(SUM(sp.time_spent_minutes), 0)::INTEGER as time_from_progress,
      COALESCE(SUM(sp.points_earned), 0)::INTEGER as points_from_progress,
      COALESCE(SUM(CASE WHEN sp.content_type = 'video' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END), 0)::INTEGER as videos,
      COALESCE(SUM(CASE WHEN sp.content_type = 'document' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END), 0)::INTEGER as documents,
      COALESCE(SUM(CASE WHEN sp.content_type = 'lesson' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END), 0)::INTEGER as lessons,
      COALESCE(SUM(CASE WHEN sp.content_type = 'project' AND sp.progress_percentage = 100 THEN 1 ELSE 0 END), 0)::INTEGER as projects
    FROM public.student_progress sp
    WHERE sp.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sp.student_id
  ),
  activity_stats AS (
    SELECT 
      sa.student_id,
      COALESCE(SUM(sa.duration_seconds) / 60, 0)::INTEGER as time_from_activities,
      COALESCE(SUM(sa.points_earned), 0)::INTEGER as points_from_activities,
      COALESCE(SUM(CASE WHEN sa.activity_type = 'game_play' THEN 1 ELSE 0 END), 0)::INTEGER as games,
      MAX(sa.created_at) as last_activity_time
    FROM public.student_activity_log sa
    WHERE sa.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sa.student_id
  ),
  achievement_stats AS (
    SELECT 
      sach.student_id,
      COALESCE(SUM(sach.points_value), 0)::INTEGER as points_from_achievements
    FROM public.student_achievements sach
    WHERE sach.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sach.student_id
  )
  SELECT 
    sl.id::UUID,
    sl.full_name::TEXT,
    COALESCE(sl.email, '')::TEXT,
    (COALESCE(ps.time_from_progress, 0) + COALESCE(ast.time_from_activities, 0))::INTEGER,
    COALESCE(ps.videos, 0)::INTEGER,
    COALESCE(ps.documents, 0)::INTEGER,
    COALESCE(ps.lessons, 0)::INTEGER,
    COALESCE(ps.projects, 0)::INTEGER,
    COALESCE(ast.games, 0)::INTEGER,
    (COALESCE(ps.points_from_progress, 0) + COALESCE(ast.points_from_activities, 0) + COALESCE(acs.points_from_achievements, 0))::INTEGER,
    ast.last_activity_time::TIMESTAMP WITH TIME ZONE
  FROM student_list sl
  LEFT JOIN progress_stats ps ON ps.student_id = sl.user_id
  LEFT JOIN activity_stats ast ON ast.student_id = sl.user_id
  LEFT JOIN achievement_stats acs ON acs.student_id = sl.user_id
  ORDER BY sl.full_name;
END;
$$;