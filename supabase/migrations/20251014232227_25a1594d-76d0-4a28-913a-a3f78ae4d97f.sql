-- إضافة unique constraint على student_id, default_task_id, project_id
ALTER TABLE grade12_student_task_progress 
DROP CONSTRAINT IF EXISTS grade12_student_task_progress_student_id_default_task_id_key;

ALTER TABLE grade12_student_task_progress 
ADD CONSTRAINT grade12_student_task_progress_unique_key 
UNIQUE (student_id, default_task_id, project_id);