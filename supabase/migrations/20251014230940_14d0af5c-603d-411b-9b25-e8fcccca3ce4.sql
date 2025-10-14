
-- حذف القيد القديم
ALTER TABLE grade12_student_task_progress
DROP CONSTRAINT IF EXISTS grade12_student_task_progress_student_id_default_task_id_key;

-- إضافة قيد unique جديد يشمل project_id
ALTER TABLE grade12_student_task_progress
ADD CONSTRAINT grade12_student_task_progress_student_project_task_key 
UNIQUE (student_id, default_task_id, project_id);

COMMENT ON CONSTRAINT grade12_student_task_progress_student_project_task_key 
ON grade12_student_task_progress 
IS 'يضمن عدم تكرار نفس المهمة لنفس الطالب في نفس المشروع';
