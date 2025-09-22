-- حذف جميع ملفات المشاريع للطالب محمود جابر
DELETE FROM public.grade10_project_files 
WHERE project_id IN (
  SELECT id FROM public.grade10_mini_projects 
  WHERE student_id = '27457a15-b3fb-4d03-aeb5-d510999d9012'
);

-- حذف جميع تعليقات المشاريع للطالب محمود جابر
DELETE FROM public.grade10_project_comments 
WHERE project_id IN (
  SELECT id FROM public.grade10_mini_projects 
  WHERE student_id = '27457a15-b3fb-4d03-aeb5-d510999d9012'
);

-- حذف جميع مهام المشاريع للطالب محمود جابر
DELETE FROM public.grade10_project_tasks 
WHERE project_id IN (
  SELECT id FROM public.grade10_mini_projects 
  WHERE student_id = '27457a15-b3fb-4d03-aeb5-d510999d9012'
);

-- حذف جميع المشاريع للطالب محمود جابر
DELETE FROM public.grade10_mini_projects 
WHERE student_id = '27457a15-b3fb-4d03-aeb5-d510999d9012';