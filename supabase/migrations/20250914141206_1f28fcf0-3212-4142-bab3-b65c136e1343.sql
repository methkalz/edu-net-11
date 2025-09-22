-- إضافة حقل project_content لجدول grade12_final_projects
ALTER TABLE grade12_final_projects 
ADD COLUMN IF NOT EXISTS project_content TEXT DEFAULT '';

-- تحديث البيانات الموجودة لضمان أن project_content ليس null
UPDATE grade12_final_projects 
SET project_content = '' 
WHERE project_content IS NULL;