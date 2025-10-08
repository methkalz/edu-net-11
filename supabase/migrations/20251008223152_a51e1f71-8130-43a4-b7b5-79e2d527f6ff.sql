-- تعديل جدول exam_attempts لدعم النظام الجديد
-- جعل exam_id اختياري للسماح باستخدام النظام الجديد (templates + instances)
ALTER TABLE exam_attempts 
  ALTER COLUMN exam_id DROP NOT NULL;

-- إضافة instance_id للربط مع teacher_exam_instances
ALTER TABLE exam_attempts 
  ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES teacher_exam_instances(id);

-- إضافة تعليق توضيحي
COMMENT ON COLUMN exam_attempts.exam_id IS 'ID للامتحان القديم (اختياري)';
COMMENT ON COLUMN exam_attempts.instance_id IS 'ID لنموذج الامتحان الجديد من teacher_exam_instances';