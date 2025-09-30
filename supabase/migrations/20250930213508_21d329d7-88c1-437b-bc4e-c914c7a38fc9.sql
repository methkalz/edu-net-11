
-- تحديث دالة recalculate_grade11_student_points لإضافة 100 نقطة أساسية
CREATE OR REPLACE FUNCTION recalculate_grade11_student_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record RECORD;
  lessons_completed INTEGER;
  videos_completed INTEGER;
  games_completed INTEGER;
  earned_points INTEGER;
  total_points INTEGER;
  new_level INTEGER;
BEGIN
  -- المرور على كل طالب في grade11_player_profiles
  FOR student_record IN 
    SELECT id, user_id, total_xp, level 
    FROM grade11_player_profiles
  LOOP
    -- حساب عدد الدروس المكتملة (من grade11_game_progress)
    SELECT COUNT(*) INTO lessons_completed
    FROM grade11_game_progress
    WHERE user_id = student_record.user_id
      AND completed_at IS NOT NULL;
    
    -- حساب عدد الفيديوهات المكتملة (من student_progress)
    SELECT COUNT(*) INTO videos_completed
    FROM student_progress
    WHERE student_id = student_record.user_id
      AND content_type = 'video'
      AND progress_percentage = 100;
    
    -- حساب عدد مراحل الألعاب المكتملة (من player_game_progress)
    SELECT COUNT(*) INTO games_completed
    FROM player_game_progress
    WHERE player_id = student_record.user_id
      AND is_completed = true;
    
    -- حساب النقاط المكتسبة من الإنجازات
    -- درس = 2 نقطة، فيديو = 20 نقطة، مرحلة لعبة = 10 نقاط
    earned_points := (lessons_completed * 2) + (videos_completed * 20) + (games_completed * 10);
    
    -- إضافة 100 نقطة أساسية
    total_points := 100 + earned_points;
    
    -- حساب المستوى (كل 100 نقطة = مستوى)
    new_level := GREATEST(1, FLOOR(total_points / 100.0) + 1);
    
    -- تحديث الملف الشخصي للطالب
    UPDATE grade11_player_profiles
    SET 
      total_xp = total_points,
      level = new_level,
      updated_at = now()
    WHERE id = student_record.id;
    
    -- تحديث points_earned في الجداول إذا لم يكن موجود
    UPDATE grade11_game_progress
    SET points_earned = 2
    WHERE user_id = student_record.user_id 
      AND completed_at IS NOT NULL
      AND (points_earned IS NULL OR points_earned = 0);
    
    UPDATE player_game_progress
    SET points_earned = 10
    WHERE player_id = student_record.user_id 
      AND is_completed = true
      AND (points_earned IS NULL OR points_earned = 0);
      
  END LOOP;
END;
$$;

-- تنفيذ الدالة لإعادة حساب النقاط مع الـ 100 نقطة الأساسية
SELECT recalculate_grade11_student_points();
