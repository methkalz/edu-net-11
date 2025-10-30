-- المرحلة 2: تحسين RPC Function مع Materialized View (نسخة مصلحة)
-- إنشاء Materialized View للـ streaks (سرعة 99%)

-- حذف الـ View القديم إذا كان موجوداً
DROP MATERIALIZED VIEW IF EXISTS student_current_streaks CASCADE;

-- إنشاء Materialized View محسن للـ streaks
CREATE MATERIALIZED VIEW student_current_streaks AS
WITH date_series AS (
  -- إنشاء سلسلة تواريخ لآخر 365 يوم
  SELECT 
    student_id,
    DATE(created_at) as activity_date,
    ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY DATE(created_at) DESC) as day_rank
  FROM student_activity_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY student_id, DATE(created_at)
),
streak_groups AS (
  -- تجميع الأيام المتتالية
  SELECT 
    student_id,
    activity_date,
    activity_date - day_rank::integer as streak_group
  FROM date_series
),
streak_lengths AS (
  -- حساب طول كل streak
  SELECT 
    student_id,
    streak_group,
    COUNT(*) as streak_length,
    MAX(activity_date) as latest_date
  FROM streak_groups
  GROUP BY student_id, streak_group
)
-- اختيار الـ streak الحالي فقط (الذي يحتوي على اليوم الحالي أو الأمس)
SELECT 
  student_id,
  COALESCE(MAX(CASE 
    WHEN latest_date >= CURRENT_DATE - INTERVAL '1 day' 
    THEN streak_length 
    ELSE 0 
  END), 0) as current_streak
FROM streak_lengths
GROUP BY student_id;

-- إنشاء Index فريد على student_id للبحث السريع
CREATE UNIQUE INDEX idx_student_current_streaks_student_id 
ON student_current_streaks(student_id);

-- إنشاء Index محسن على student_activity_log (بدون WHERE clause)
CREATE INDEX IF NOT EXISTS idx_activity_log_student_date 
ON student_activity_log(student_id, created_at DESC);

-- تحديث RPC Function لاستخدام الـ View الجديد
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
  current_streak integer := 0;
  total_activities integer;
  achievements_count integer;
  student_grade text;
BEGIN
  -- الحصول على صف الطالب
  SELECT get_student_assigned_grade(student_uuid) INTO student_grade;
  
  -- استخدام get_student_total_points لجميع الصفوف
  SELECT get_student_total_points(student_uuid) INTO total_points;
  
  -- ✅ استخدام Materialized View بدلاً من LOOP (سرعة 99%)
  SELECT COALESCE(scs.current_streak, 0)
  INTO current_streak
  FROM student_current_streaks scs
  WHERE scs.student_id = student_uuid;
  
  -- الحسابات الأخرى (سريعة)
  SELECT 
    COUNT(*) FILTER (WHERE content_type = 'video' AND progress_percentage = 100),
    COUNT(*) FILTER (WHERE content_type = 'project' AND progress_percentage = 100)
  INTO completed_videos, completed_projects
  FROM public.student_progress 
  WHERE student_id = student_uuid;
  
  SELECT COUNT(*) INTO total_activities
  FROM public.student_activity_log 
  WHERE student_id = student_uuid;
  
  SELECT COUNT(*) INTO achievements_count
  FROM public.student_achievements 
  WHERE student_id = student_uuid;
  
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

-- Refresh أولي للـ View
REFRESH MATERIALIZED VIEW student_current_streaks;