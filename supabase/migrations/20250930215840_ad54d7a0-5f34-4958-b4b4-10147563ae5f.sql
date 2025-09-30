
-- تصفير بيانات الطالب محمد السالم (user_id: d7c77f78-1412-4018-beda-66266dbf4d55)

-- حذف تقدم الطالب في المحتوى (الفيديوهات والدروس)
DELETE FROM student_progress 
WHERE student_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- حذف تقدم دروس grade11
DELETE FROM grade11_game_progress 
WHERE user_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- حذف تقدم مراحل الألعاب
DELETE FROM player_game_progress 
WHERE player_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- حذف سجل النشاطات
DELETE FROM student_activity_log 
WHERE student_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- حذف الإنجازات
DELETE FROM student_achievements 
WHERE student_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- إعادة تعيين ملف اللاعب في grade11 (النقاط والمستوى)
UPDATE grade11_player_profiles
SET 
  total_xp = 100,
  level = 1,
  updated_at = now()
WHERE user_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- إعادة تعيين وقت الحضور
UPDATE student_presence
SET 
  total_time_minutes = 0,
  session_start_at = NULL,
  updated_at = now()
WHERE user_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';
