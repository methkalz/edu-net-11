-- تحديث دالة get_student_total_points لحساب 40 نقطة لكل فيديو في الصف 12
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
  base_points integer;
  progress_points integer;
  
  -- Grade 10 variables
  computer_structure_lessons integer;
  windows_videos integer;
  networking_videos integer;
  communication_lessons integer;
BEGIN
  -- Get student grade
  SELECT get_student_assigned_grade(student_uuid) INTO student_grade;
  
  -- Get base points from profiles
  SELECT COALESCE(points, 0) INTO base_points
  FROM profiles
  WHERE user_id = student_uuid;
  
  -- Grade 11 logic
  IF student_grade = '11' THEN
    SELECT COUNT(*) INTO completed_videos
    FROM student_progress
    WHERE student_id = student_uuid
      AND content_type = 'video'
      AND progress_percentage = 100;
    
    SELECT COUNT(*) INTO completed_lessons
    FROM student_progress
    WHERE student_id = student_uuid
      AND content_type = 'lesson'
      AND progress_percentage = 100;
    
    SELECT COUNT(*) INTO completed_lessons_from_game_progress
    FROM grade11_game_progress
    WHERE user_id = student_uuid
      AND completed_at IS NOT NULL;
    
    SELECT COUNT(*) INTO completed_games
    FROM player_game_progress
    WHERE player_id = student_uuid
      AND is_completed = true;
    
    total_points := 100 + 
                    (COALESCE(completed_videos, 0) * 20) + 
                    (COALESCE(completed_lessons, 0) * 2) +
                    (COALESCE(completed_lessons_from_game_progress, 0) * 2) +
                    (COALESCE(completed_games, 0) * 10);
    
    RETURN total_points;
  END IF;
  
  -- Grade 10 logic
  IF student_grade = '10' THEN
    SELECT COUNT(*) INTO computer_structure_lessons
    FROM grade10_lessons gl
    JOIN grade10_topics gt ON gl.topic_id = gt.id  
    JOIN grade10_sections gs ON gt.section_id = gs.id
    WHERE gs.title LIKE '%تركيبة الحاسوب%'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gl.id
          AND sp.content_type = 'lesson' 
          AND sp.progress_percentage = 100
      );
    
    SELECT COUNT(*) INTO windows_videos
    FROM grade10_videos gv
    WHERE gv.video_category = 'windows_basics'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gv.id
          AND sp.content_type = 'video' 
          AND sp.progress_percentage = 100
      );
    
    SELECT COUNT(*) INTO networking_videos
    FROM grade10_videos gv
    WHERE gv.video_category = 'educational_explanations'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gv.id
          AND sp.content_type = 'video' 
          AND sp.progress_percentage = 100
      );
    
    SELECT COUNT(*) INTO completed_games
    FROM player_game_progress pgp
    WHERE pgp.player_id = student_uuid
      AND pgp.is_completed = true;
    
    SELECT COUNT(*) INTO communication_lessons
    FROM grade10_lessons gl
    JOIN grade10_topics gt ON gl.topic_id = gt.id  
    JOIN grade10_sections gs ON gt.section_id = gs.id
    WHERE gs.title LIKE '%أساسيات الاتصال%'
      AND EXISTS (
        SELECT 1 FROM student_progress sp 
        WHERE sp.student_id = student_uuid
          AND sp.content_id = gl.id
          AND sp.content_type = 'lesson' 
          AND sp.progress_percentage = 100
      );
    
    total_points := 100 + 
                    (COALESCE(computer_structure_lessons, 0) * 20) + 
                    (COALESCE(windows_videos, 0) * 20) +
                    (COALESCE(networking_videos, 0) * 30) +
                    (COALESCE(completed_games, 0) * 30) +
                    (COALESCE(communication_lessons, 0) * 20);
    
    RETURN total_points;
  END IF;
  
  -- Grade 12 logic - حساب 40 نقطة لكل فيديو مكتمل
  IF student_grade = '12' THEN
    -- حساب عدد الفيديوهات المكتملة
    SELECT COUNT(*) INTO completed_videos
    FROM student_progress
    WHERE student_id = student_uuid
      AND content_type = 'video'
      AND progress_percentage = 100;
    
    -- النقاط الإجمالية = النقاط الأساسية + (40 نقطة × عدد الفيديوهات)
    total_points := base_points + (completed_videos * 40);
    
    RETURN total_points;
  END IF;
  
  -- Other grades - استخدام النقاط من profiles مباشرة
  RETURN base_points;
END;
$function$;