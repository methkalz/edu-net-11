-- حذف الـ Triggers أولاً (قبل الـ Function)
DROP TRIGGER IF EXISTS update_grade11_points_config_updated_at ON grade11_points_config;
DROP TRIGGER IF EXISTS update_grade11_student_points_updated_at ON grade11_student_points_breakdown;
DROP TRIGGER IF EXISTS update_grade11_student_points_breakdown_updated_at ON grade11_student_points_breakdown;

-- حذف الجداول (سيحذف كل ما يعتمد عليها)
DROP TABLE IF EXISTS grade11_student_points_breakdown CASCADE;
DROP TABLE IF EXISTS grade11_points_config CASCADE;

-- حذف View
DROP VIEW IF EXISTS grade11_student_points_summary CASCADE;

-- حذف Functions
DROP FUNCTION IF EXISTS get_grade11_student_total_points(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_grade11_points_updated_at() CASCADE;