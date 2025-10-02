
-- تصفير بيانات التقدم للطالب مروان مروان
-- User ID: 8b757645-b351-4fa9-837f-e90a2260e94d
-- Student ID: d38a935e-c67e-4b21-83cb-e47f368e0e2a

-- حذف تقدم المحتوى
DELETE FROM student_progress 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف سجل النشاطات
DELETE FROM student_activity_log 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف الإنجازات
DELETE FROM student_achievements 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف احتفالات الأوسمة
DELETE FROM student_badge_celebrations 
WHERE student_id = 'd38a935e-c67e-4b21-83cb-e47f368e0e2a';

-- حذف تقدم الألعاب للصف 11
DELETE FROM grade11_game_progress 
WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف تقدم الألعاب العامة
DELETE FROM player_game_progress 
WHERE player_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف ملف اللاعب للصف 11
DELETE FROM grade11_player_profiles 
WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف تقدم الألعاب للصف 10 (يستخدم player_id)
DELETE FROM grade10_game_progress 
WHERE player_id IN (
  SELECT id FROM grade10_player_profiles WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d'
);

-- حذف إنجازات الألعاب للصف 10
DELETE FROM grade10_game_achievements 
WHERE player_id IN (
  SELECT id FROM grade10_player_profiles WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d'
);

-- حذف ملف اللاعب للصف 10
DELETE FROM grade10_player_profiles 
WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف تعليقات مشاريع الصف 10
DELETE FROM grade10_project_comments 
WHERE project_id IN (
  SELECT id FROM grade10_mini_projects WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d'
);

-- حذف مشاريع الصف 10
DELETE FROM grade10_mini_projects 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف تعليقات مشاريع الصف 12
DELETE FROM grade12_project_comments 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d'
);

-- حذف مشاريع الصف 12
DELETE FROM grade12_final_projects 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف أسئلة محاولات الامتحانات
DELETE FROM exam_attempt_questions 
WHERE attempt_id IN (
  SELECT id FROM exam_attempts WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d'
);

-- حذف محاولات الامتحانات
DELETE FROM exam_attempts 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف محاولات التمارين
DELETE FROM exercise_attempts 
WHERE student_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- حذف جلسات الاختبارات للصف 11
DELETE FROM grade11_quiz_sessions 
WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- إعادة تعيين النقاط في الملف الشخصي إلى 100 (النقطة الأساسية)
UPDATE profiles 
SET points = 100, 
    display_title = 'طالب جديد',
    updated_at = now()
WHERE user_id = '8b757645-b351-4fa9-837f-e90a2260e94d';

-- إعادة تعيين بيانات الحضور
UPDATE student_presence 
SET total_time_minutes = 0,
    session_start_at = NULL,
    updated_at = now()
WHERE student_id = 'd38a935e-c67e-4b21-83cb-e47f368e0e2a';
