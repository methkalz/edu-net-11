-- تحديث دالة حساب النقاط لتشمل الدروس من student_progress
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
  
  -- للصفوف الأخرى، الحساب القديم
  RETURN COALESCE(
    (SELECT SUM(points_earned) FROM public.student_progress WHERE student_id = student_uuid) +
    (SELECT SUM(points_value) FROM public.student_achievements WHERE student_id = student_uuid) +
    (SELECT SUM(points_earned) FROM public.student_activity_log WHERE student_id = student_uuid),
    0
  );
END;
$function$;