-- إصلاح دالة get_student_dashboard_stats: إزالة ::uuid غير الضرورية
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
  
  -- Get completed content counts (إزالة ::uuid لأن student_uuid بالفعل uuid)
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

-- إصلاح دالة get_student_total_points: إزالة ::uuid غير الضرورية
CREATE OR REPLACE FUNCTION public.get_student_total_points(student_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  student_grade text;
  completed_videos integer;
  completed_lessons integer;
  completed_lessons_from_game_progress integer;
  completed_games integer;
  total_points integer;
  
  -- متغيرات الصف العاشر
  computer_structure_lessons integer;
  windows_videos integer;
  networking_videos integer;
  communication_lessons integer;
BEGIN
  -- الحصول على صف الطالب
  SELECT get_student_assigned_grade(student_uuid) INTO student_grade;
  
  -- للصف الحادي عشر، حساب النقاط من المحتوى المكتمل مباشرة
  IF student_grade = '11' THEN
    -- عدد الفيديوهات المكتملة (20 نقطة لكل فيديو)
    SELECT COUNT(*) INTO completed_videos
    FROM student_progress
    WHERE student_id = student_uuid
      AND content_type = 'video'
      AND progress_percentage = 100;
    
    -- عدد الدروس المكتملة من student_progress (2 نقطة لكل درس)
    SELECT COUNT(*) INTO completed_lessons
    FROM student_progress
    WHERE student_id = student_uuid
      AND content_type = 'lesson'
      AND progress_percentage = 100;
    
    -- عدد الدروس المكتملة من grade11_game_progress (2 نقطة لكل درس)
    SELECT COUNT(*) INTO completed_lessons_from_game_progress
    FROM grade11_game_progress
    WHERE user_id = student_uuid
      AND completed_at IS NOT NULL;
    
    -- عدد مراحل الألعاب المكتملة (10 نقاط لكل مرحلة)
    SELECT COUNT(*) INTO completed_games
    FROM player_game_progress
    WHERE player_id = student_uuid
      AND is_completed = true;
    
    -- حساب النقاط الإجمالية: 100 نقطة أساسية + نقاط المحتوى
    total_points := 100 + 
                    (COALESCE(completed_videos, 0) * 20) + 
                    (COALESCE(completed_lessons, 0) * 2) +
                    (COALESCE(completed_lessons_from_game_progress, 0) * 2) +
                    (COALESCE(completed_games, 0) * 10);
    
    RETURN total_points;
  END IF;
  
  -- للصف العاشر، نظام نقاط جديد
  IF student_grade = '10' THEN
    -- 1. دروس مبنى الحاسوب (20 نقطة لكل درس)
    SELECT COUNT(*) INTO computer_structure_lessons
    FROM grade10_lessons gl
    JOIN grade10_topics gt ON gl.topic_id = gt.id  
    JOIN grade10_sections gs ON gt.section_id = gs.id
    WHERE gs.title LIKE '%تركيبة الحاسوب%'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gl.id::text 
          AND sp.content_type = 'lesson' 
          AND sp.progress_percentage = 100
      );
    
    -- 2. فيديوهات أساسيات الويندوز (20 نقطة لكل فيديو)
    SELECT COUNT(*) INTO windows_videos
    FROM grade10_videos gv
    WHERE gv.video_category = 'windows_basics'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gv.id::text 
          AND sp.content_type = 'video' 
          AND sp.progress_percentage = 100
      );
    
    -- 3. فيديوهات مقدمة عن الشبكات (30 نقطة لكل فيديو)
    SELECT COUNT(*) INTO networking_videos
    FROM grade10_videos gv
    WHERE gv.video_category = 'educational_explanations'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gv.id::text 
          AND sp.content_type = 'video' 
          AND sp.progress_percentage = 100
      );
    
    -- 4. مراحل لعبة المعرفة (30 نقطة لكل مرحلة)
    SELECT COUNT(*) INTO completed_games
    FROM player_game_progress pgp
    WHERE pgp.player_id = student_uuid
      AND pgp.is_completed = true;
    
    -- 5. دروس أساسيات الاتصال (20 نقطة لكل درس)
    SELECT COUNT(*) INTO communication_lessons
    FROM grade10_lessons gl
    JOIN grade10_topics gt ON gl.topic_id = gt.id  
    JOIN grade10_sections gs ON gt.section_id = gs.id
    WHERE gs.title LIKE '%أساسيات الاتصال%'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gl.id::text 
          AND sp.content_type = 'lesson' 
          AND sp.progress_percentage = 100
      );
    
    -- حساب النقاط الإجمالية: 100 نقطة أساسية + نقاط المحتوى
    total_points := 100 + 
                    (COALESCE(computer_structure_lessons, 0) * 20) + 
                    (COALESCE(windows_videos, 0) * 20) +
                    (COALESCE(networking_videos, 0) * 30) +
                    (COALESCE(completed_games, 0) * 30) +
                    (COALESCE(communication_lessons, 0) * 20);
    
    RETURN total_points;
  END IF;
  
  -- للصفوف الأخرى، الحساب القديم
  RETURN COALESCE(
    (SELECT SUM(points_earned) FROM public.student_progress WHERE student_id = student_uuid) +
    (SELECT SUM(points_value) FROM public.student_achievements WHERE student_id = student_uuid) +
    (SELECT SUM(points_earned) FROM public.student_activity_log WHERE student_id = student_uuid),
    0
  );
END;
$function$;

-- إصلاح دالة get_student_assigned_grade: إزالة ::uuid غير الضرورية
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
  WHERE s.user_id = student_user_id
  LIMIT 1;
  
  -- Return the grade level, default to '11' if not found
  RETURN COALESCE(student_grade, '11');
END;
$function$;