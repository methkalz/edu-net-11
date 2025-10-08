-- إنشاء جدول teacher_exam_instances لتخزين نسخ شخصية من الاختبارات لكل معلم
CREATE TABLE teacher_exam_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES exam_templates(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID NOT NULL,
  school_id UUID NOT NULL,
  
  -- إعدادات شخصية قابلة للتخصيص
  is_active BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 1,
  show_results_immediately BOOLEAN DEFAULT false,
  randomize_questions BOOLEAN DEFAULT true,
  randomize_answers BOOLEAN DEFAULT true,
  pass_percentage INTEGER DEFAULT 60,
  
  -- تخصيص الاختبار للصفوف
  target_class_ids UUID[] DEFAULT '{}',
  
  -- جدولة زمنية
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- تتبع
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(template_id, teacher_id)
);

-- Index لتحسين الأداء
CREATE INDEX idx_teacher_exam_instances_teacher ON teacher_exam_instances(teacher_id);
CREATE INDEX idx_teacher_exam_instances_active ON teacher_exam_instances(is_active) WHERE is_active = true;
CREATE INDEX idx_teacher_exam_instances_schedule ON teacher_exam_instances(starts_at, ends_at) WHERE is_active = true;

-- Trigger لتحديث updated_at
CREATE TRIGGER update_teacher_exam_instances_updated_at
  BEFORE UPDATE ON teacher_exam_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- تفعيل RLS
ALTER TABLE teacher_exam_instances ENABLE ROW LEVEL SECURITY;

-- المعلمون يمكنهم إدارة نسخهم الخاصة
CREATE POLICY "Teachers manage their own exam instances"
ON teacher_exam_instances
FOR ALL
USING (
  teacher_id = auth.uid() 
  AND school_id = get_user_school_id()
)
WITH CHECK (
  teacher_id = auth.uid() 
  AND school_id = get_user_school_id()
);

-- المدراء يمكنهم رؤية كل نسخ مدرستهم
CREATE POLICY "School admins view all instances"
ON teacher_exam_instances
FOR SELECT
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- الطلاب يمكنهم رؤية الاختبارات النشطة المخصصة لصفوفهم
CREATE POLICY "Students view active exams for their classes"
ON teacher_exam_instances
FOR SELECT
USING (
  is_active = true 
  AND now() >= COALESCE(starts_at, now() - interval '1 year')
  AND (ends_at IS NULL OR now() <= ends_at)
  AND EXISTS (
    SELECT 1 
    FROM class_students cs
    JOIN students s ON s.id = cs.student_id
    WHERE s.user_id = auth.uid()
      AND cs.class_id = ANY(target_class_ids)
  )
);