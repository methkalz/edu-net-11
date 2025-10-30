-- =====================================================
-- Migration: Super Admin Statistics System
-- =====================================================

-- 1. Create Materialized View for School Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS superadmin_school_stats AS
WITH school_metrics AS (
  SELECT 
    s.id as school_id,
    s.name as school_name,
    s.city,
    s.created_at,
    sp.package_id,
    p.name_ar as package_name,
    COUNT(DISTINCT st.id) as total_students,
    COUNT(DISTINCT CASE WHEN pr.role = 'teacher' THEN pr.user_id END) as total_teachers,
    COUNT(DISTINCT c.id) as total_classes,
    AVG(pr.points) FILTER (WHERE pr.role = 'student') as avg_student_points,
    SUM(pr.points) FILTER (WHERE pr.role = 'student') as total_points
  FROM schools s
  LEFT JOIN school_packages sp ON sp.school_id = s.id AND sp.status = 'active'
  LEFT JOIN packages p ON p.id = sp.package_id
  LEFT JOIN students st ON st.school_id = s.id
  LEFT JOIN profiles pr ON pr.school_id = s.id
  LEFT JOIN classes c ON c.school_id = s.id AND c.status = 'active'
  GROUP BY s.id, s.name, s.city, s.created_at, sp.package_id, p.name_ar
)
SELECT 
  sm.*,
  CASE 
    WHEN sm.total_teachers > 0 
    THEN ROUND(CAST(sm.total_students AS NUMERIC) / sm.total_teachers, 1)
    ELSE 0
  END as student_teacher_ratio,
  NOW() as last_refreshed
FROM school_metrics sm;

CREATE UNIQUE INDEX IF NOT EXISTS idx_superadmin_school_stats_school_id 
ON superadmin_school_stats(school_id);

REFRESH MATERIALIZED VIEW superadmin_school_stats;