
-- إضافة عمود project_id لجدول grade12_student_task_progress
ALTER TABLE grade12_student_task_progress
ADD COLUMN project_id uuid REFERENCES grade12_final_projects(id) ON DELETE CASCADE;

-- إنشاء index لتحسين الأداء
CREATE INDEX idx_grade12_student_task_progress_project_id 
ON grade12_student_task_progress(project_id);

-- تحديث السجلات القديمة لربطها بأول مشروع للطالب (إذا وجد)
UPDATE grade12_student_task_progress stp
SET project_id = (
  SELECT gfp.id 
  FROM grade12_final_projects gfp 
  WHERE gfp.student_id = stp.student_id 
  ORDER BY gfp.created_at ASC 
  LIMIT 1
)
WHERE project_id IS NULL;

COMMENT ON COLUMN grade12_student_task_progress.project_id IS 'ربط كل مهمة بمشروع محدد';
