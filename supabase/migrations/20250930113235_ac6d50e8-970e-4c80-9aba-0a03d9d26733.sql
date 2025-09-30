-- تحديث دالة تتبع الطلاب لحساب الوقت بناءً على جلسات الحضور
CREATE OR REPLACE FUNCTION public.get_teacher_student_tracking(
  teacher_user_id uuid,
  teacher_school_id uuid
)
RETURNS TABLE(
  student_id uuid,
  student_name text,
  student_email text,
  student_grade text,
  total_time_minutes integer,
  total_points integer,
  last_activity timestamp with time zone,
  progress_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH student_list AS (
    SELECT 
      s.id,
      s.user_id,
      s.full_name,
      s.email,
      CASE 
        WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
        WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'
        WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
        ELSE COALESCE(gl.code, '11')
      END as grade_level
    FROM public.students s
    LEFT JOIN public.class_students cs ON cs.student_id = s.id
    LEFT JOIN public.classes c ON c.id = cs.class_id
    LEFT JOIN public.grade_levels gl ON gl.id = c.grade_level_id
    WHERE s.school_id = teacher_school_id
      AND s.user_id IS NOT NULL
  ),
  presence_time AS (
    SELECT 
      sp.user_id,
      -- الوقت الكلي = الوقت المحفوظ + وقت الجلسة الحالية (إذا كان online)
      (COALESCE(sp.total_time_minutes, 0) +
        CASE 
          WHEN sp.is_online AND sp.session_start_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (now() - sp.session_start_at)) / 60
          ELSE 0
        END)::INTEGER as presence_minutes,
      sp.last_seen_at
    FROM public.student_presence sp
    WHERE sp.user_id IN (SELECT user_id FROM student_list)
  ),
  progress_details AS (
    SELECT 
      sp.student_id,
      jsonb_agg(
        jsonb_build_object(
          'content_id', sp.content_id,
          'content_type', sp.content_type,
          'progress_percentage', sp.progress_percentage,
          'time_spent_minutes', sp.time_spent_minutes,
          'points_earned', sp.points_earned,
          'completed_at', sp.completed_at,
          'updated_at', sp.updated_at
        ) ORDER BY sp.updated_at DESC
      ) as progress_items,
      COALESCE(SUM(sp.points_earned), 0)::INTEGER as progress_points
    FROM public.student_progress sp
    WHERE sp.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sp.student_id
  ),
  activity_stats AS (
    SELECT 
      sa.student_id,
      COALESCE(SUM(sa.points_earned), 0)::INTEGER as activity_points,
      MAX(sa.created_at) as last_activity_time
    FROM public.student_activity_log sa
    WHERE sa.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sa.student_id
  ),
  achievement_stats AS (
    SELECT 
      sach.student_id,
      COALESCE(SUM(sach.points_value), 0)::INTEGER as achievement_points
    FROM public.student_achievements sach
    WHERE sach.student_id IN (SELECT user_id FROM student_list)
    GROUP BY sach.student_id
  ),
  grade10_projects AS (
    SELECT 
      gmp.student_id,
      jsonb_agg(
        jsonb_build_object(
          'project_id', gmp.id,
          'title', gmp.title,
          'progress_percentage', COALESCE(gmp.progress_percentage, 0),
          'status', gmp.status,
          'updated_at', gmp.updated_at
        )
      ) as projects
    FROM public.grade10_mini_projects gmp
    WHERE gmp.student_id IN (SELECT user_id FROM student_list)
    GROUP BY gmp.student_id
  ),
  grade12_projects AS (
    SELECT 
      gfp.student_id,
      jsonb_agg(
        jsonb_build_object(
          'project_id', gfp.id,
          'title', gfp.title,
          'status', gfp.status,
          'grade', gfp.grade,
          'submitted_at', gfp.submitted_at,
          'updated_at', gfp.updated_at
        )
      ) as projects
    FROM public.grade12_final_projects gfp
    WHERE gfp.student_id IN (SELECT user_id FROM student_list)
    GROUP BY gfp.student_id
  ),
  game_progress AS (
    SELECT 
      pgp.player_id,
      jsonb_agg(
        jsonb_build_object(
          'game_id', pmg.id,
          'game_title', pmg.title,
          'level', pmg.level_number,
          'stage', pmg.stage_number,
          'is_completed', pgp.is_completed,
          'best_score', pgp.best_score,
          'completion_count', pgp.completion_count
        )
      ) as games
    FROM public.player_game_progress pgp
    JOIN public.pair_matching_games pmg ON pmg.id = pgp.game_id
    WHERE pgp.player_id IN (SELECT user_id FROM student_list)
    GROUP BY pgp.player_id
  )
  SELECT 
    sl.id::UUID,
    sl.full_name::TEXT,
    COALESCE(sl.email, '')::TEXT,
    sl.grade_level::TEXT,
    COALESCE(pt.presence_minutes, 0)::INTEGER,
    (COALESCE(pd.progress_points, 0) + COALESCE(ast.activity_points, 0) + COALESCE(acs.achievement_points, 0))::INTEGER,
    GREATEST(
      COALESCE(pt.last_seen_at, '1970-01-01'::timestamp),
      COALESCE(ast.last_activity_time, '1970-01-01'::timestamp)
    )::TIMESTAMP WITH TIME ZONE,
    jsonb_build_object(
      'content_progress', COALESCE(pd.progress_items, '[]'::jsonb),
      'grade10_projects', COALESCE(g10p.projects, '[]'::jsonb),
      'grade12_projects', COALESCE(g12p.projects, '[]'::jsonb),
      'game_progress', COALESCE(gp.games, '[]'::jsonb)
    )::JSONB
  FROM student_list sl
  LEFT JOIN presence_time pt ON pt.user_id = sl.user_id
  LEFT JOIN progress_details pd ON pd.student_id = sl.user_id
  LEFT JOIN activity_stats ast ON ast.student_id = sl.user_id
  LEFT JOIN achievement_stats acs ON acs.student_id = sl.user_id
  LEFT JOIN grade10_projects g10p ON g10p.student_id = sl.user_id
  LEFT JOIN grade12_projects g12p ON g12p.student_id = sl.user_id
  LEFT JOIN game_progress gp ON gp.player_id = sl.user_id
  ORDER BY sl.full_name;
END;
$function$;