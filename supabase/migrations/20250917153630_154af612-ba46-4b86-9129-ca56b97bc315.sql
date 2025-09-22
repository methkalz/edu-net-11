-- حذف جميع المشاريع النهائية للطالب رواد زيدان
-- أولاً حذف التعليقات المرتبطة بالمشاريع
DELETE FROM grade12_project_comments 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects 
  WHERE student_id = 'e9bcefe6-f955-4eb5-bbf2-a29bbafe9f50'
);

-- حذف المهام المرتبطة بالمشاريع
DELETE FROM grade12_project_tasks 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects 
  WHERE student_id = 'e9bcefe6-f955-4eb5-bbf2-a29bbafe9f50'
);

-- حذف المراجعات المرتبطة بالمشاريع  
DELETE FROM grade12_project_revisions 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects 
  WHERE student_id = 'e9bcefe6-f955-4eb5-bbf2-a29bbafe9f50'
);

-- أخيراً حذف المشاريع نفسها
DELETE FROM grade12_final_projects 
WHERE student_id = 'e9bcefe6-f955-4eb5-bbf2-a29bbafe9f50';