-- تحديث دالة حساب النقاط لدعم الصف العاشر
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