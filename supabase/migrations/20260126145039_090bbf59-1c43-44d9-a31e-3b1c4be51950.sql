-- المرحلة 1: دعم هياكل امتحانات البجروت المختلفة

-- 1.1 إضافة نوع هيكل الامتحان لجدول bagrut_exams
ALTER TABLE bagrut_exams 
ADD COLUMN IF NOT EXISTS exam_structure_type TEXT DEFAULT 'standard'
CHECK (exam_structure_type IN ('standard', 'all_mandatory'));

-- 1.2 إضافة عدد الأقسام الاختيارية المطلوب اختيارها (للمستقبل)
ALTER TABLE bagrut_exams 
ADD COLUMN IF NOT EXISTS required_elective_sections INTEGER DEFAULT 1;

-- 1.3 إضافة مجموعة القسم الاختياري (للمستقبل - دعم اختيار من مجموعات)
ALTER TABLE bagrut_exam_sections 
ADD COLUMN IF NOT EXISTS elective_group TEXT;

-- 1.4 إضافة الحد الأقصى للعلامات في القسم (لدعم امتحانات 2019-2021)
ALTER TABLE bagrut_exam_sections 
ADD COLUMN IF NOT EXISTS max_points_cap INTEGER;

-- تحديث الامتحانات الموجودة للتأكد من القيم الافتراضية
UPDATE bagrut_exams 
SET exam_structure_type = 'standard' 
WHERE exam_structure_type IS NULL;

UPDATE bagrut_exams 
SET required_elective_sections = 1 
WHERE required_elective_sections IS NULL;