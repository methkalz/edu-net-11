-- تغيير نوع selected_sections من uuid[] إلى text[]
ALTER TABLE exams 
ALTER COLUMN selected_sections TYPE text[] 
USING ARRAY[]::text[];

-- إضافة GIN index للأداء الأمثل (Best Practice 2024)
CREATE INDEX IF NOT EXISTS idx_exams_selected_sections 
ON exams USING GIN (selected_sections);