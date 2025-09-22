-- إنشاء view محسّن لعرض المشاريع مع معلومات الطلاب والتعليقات
CREATE OR REPLACE VIEW teacher_projects_view AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.status,
    p.grade,
    p.updated_at,
    p.created_at,
    p.student_id,
    p.school_id,
    pr.full_name as student_name,
    COALESCE(tc.total_comments, 0) AS total_comments_count,
    COALESCE(uc.unread_comments, 0) AS unread_comments_count,
    COALESCE(ts.completion_percentage, 0) AS completion_percentage
FROM grade12_final_projects p
LEFT JOIN profiles pr ON p.student_id = pr.user_id
LEFT JOIN (
    SELECT 
        project_id, 
        COUNT(*) as total_comments
    FROM grade12_project_comments 
    GROUP BY project_id
) tc ON p.id = tc.project_id
LEFT JOIN (
    SELECT 
        project_id, 
        COUNT(*) as unread_comments
    FROM grade12_project_comments 
    WHERE is_read = false
    GROUP BY project_id
) uc ON p.id = uc.project_id
LEFT JOIN (
    SELECT 
        project_id,
        CASE 
            WHEN total_tasks > 0 THEN ROUND((completed_tasks::numeric / total_tasks) * 100)
            ELSE 0
        END as completion_percentage
    FROM (
        SELECT 
            project_id,
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE is_completed = true) as completed_tasks
        FROM grade12_project_tasks
        GROUP BY project_id
    ) task_stats
) ts ON p.id = ts.project_id;