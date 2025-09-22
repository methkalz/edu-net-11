-- إضافة صلاحية INSERT للطلاب في جدول grade10_project_tasks
CREATE POLICY "Students can create tasks for their projects" 
ON public.grade10_project_tasks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.grade10_mini_projects p 
    WHERE p.id = grade10_project_tasks.project_id 
    AND p.student_id = auth.uid()
  )
);