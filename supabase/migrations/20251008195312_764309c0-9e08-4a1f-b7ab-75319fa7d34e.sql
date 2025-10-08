-- إضافة عمود target_class_id إلى exam_templates
ALTER TABLE exam_templates 
ADD COLUMN target_class_id UUID REFERENCES classes(id);

-- إضافة index لتحسين الأداء
CREATE INDEX idx_exam_templates_target_class 
ON exam_templates(target_class_id);

-- تحديث RLS Policies - إضافة policy للطلاب لرؤية الاختبارات المخصصة لصفهم فقط
CREATE POLICY "Students view exams for their class"
ON exam_templates
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 
    FROM class_students cs
    JOIN students s ON s.id = cs.student_id
    WHERE s.user_id = auth.uid()
      AND cs.class_id = exam_templates.target_class_id
  )
);