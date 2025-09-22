-- إصلاح سياسات RLS لجدول grade12_student_task_progress لدعم الطلاب

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "Students can manage their own progress" ON grade12_student_task_progress;
DROP POLICY IF EXISTS "School admins can view progress" ON grade12_student_task_progress;

-- إنشاء سياسات جديدة أكثر تفصيلاً
CREATE POLICY "Students can view their own task progress"
ON grade12_student_task_progress
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own task progress"
ON grade12_student_task_progress
FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own task progress"
ON grade12_student_task_progress
FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "School admins can manage all progress"
ON grade12_student_task_progress
FOR ALL
USING (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- التأكد من تفعيل RLS
ALTER TABLE grade12_student_task_progress ENABLE ROW LEVEL SECURITY;