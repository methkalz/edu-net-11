
-- تصفير بيانات الطالب محمد السالم
-- user_id: d7c77f78-1412-4018-beda-66266dbf4d55

-- 1. حذف سجلات تقدم المحتوى
DELETE FROM student_progress 
WHERE student_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- 2. حذف سجلات النشاطات
DELETE FROM student_activity_log 
WHERE student_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- 3. حذف الإنجازات (إن وجدت)
DELETE FROM student_achievements 
WHERE student_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- 4. حذف تقدم دروس الصف 11 (إن وجد)
DELETE FROM grade11_game_progress 
WHERE user_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- 5. حذف تقدم الألعاب (إن وجد)
DELETE FROM player_game_progress 
WHERE player_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- 6. إعادة تعيين ملف اللاعب للقيم الأولية
UPDATE grade11_player_profiles
SET 
  total_xp = 100,
  level = 1,
  coins = 0,
  streak_days = 0,
  updated_at = now()
WHERE user_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';

-- 7. إعادة تعيين النقاط في جدول profiles
UPDATE profiles
SET 
  points = 100,
  display_title = 'طالب جديد'
WHERE user_id = 'd7c77f78-1412-4018-beda-66266dbf4d55';
