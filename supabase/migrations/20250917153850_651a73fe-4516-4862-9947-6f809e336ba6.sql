-- حذف جميع المشاريع النهائية للطالب رواد زيدان (48 مشروع)
-- أولاً حذف التعليقات المرتبطة بالمشاريع
DELETE FROM grade12_project_comments 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects 
  WHERE student_id = '0b757d94-8a7a-4ba3-9baa-966d9f190189'
);

-- حذف المهام المرتبطة بالمشاريع
DELETE FROM grade12_project_tasks 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects 
  WHERE student_id = '0b757d94-8a7a-4ba3-9baa-966d9f190189'
);

-- حذف المراجعات المرتبطة بالمشاريع  
DELETE FROM grade12_project_revisions 
WHERE project_id IN (
  SELECT id FROM grade12_final_projects 
  WHERE student_id = '0b757d94-8a7a-4ba3-9baa-966d9f190189'
);

-- أخيراً حذف المشاريع النهائية (48 مشروع)
DELETE FROM grade12_final_projects 
WHERE student_id = '0b757d94-8a7a-4ba3-9baa-966d9f190189';