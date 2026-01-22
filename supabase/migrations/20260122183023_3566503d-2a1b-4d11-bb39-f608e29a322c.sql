-- ==============================================
-- Phase 1: إضافة الأعمدة والجداول المطلوبة لنظام امتحانات البجروت
-- ==============================================

-- 1. إضافة عمود max_attempts لجدول bagrut_exams
ALTER TABLE bagrut_exams 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

-- 2. إضافة عمود is_result_published لجدول bagrut_attempts
ALTER TABLE bagrut_attempts 
ADD COLUMN IF NOT EXISTS is_result_published BOOLEAN DEFAULT false;

-- 3. إنشاء جدول العلامات التفصيلية للأسئلة
CREATE TABLE IF NOT EXISTS bagrut_question_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES bagrut_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES bagrut_questions(id) ON DELETE CASCADE,
  auto_score INTEGER, -- العلامة التلقائية (للأسئلة الموضوعية)
  manual_score INTEGER, -- العلامة اليدوية من المعلم
  final_score INTEGER, -- العلامة النهائية
  max_score INTEGER NOT NULL, -- أقصى علامة للسؤال
  teacher_feedback TEXT, -- ملاحظات المعلم
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- 4. تمكين RLS على الجدول الجديد
ALTER TABLE bagrut_question_grades ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- تصحيح وتحديث سياسات RLS
-- ==============================================

-- 5. حذف السياسات القديمة للمعلمين (بها خطأ)
DROP POLICY IF EXISTS "Teachers can view attempts from their school" ON bagrut_attempts;

-- 6. إنشاء سياسة صحيحة للمعلمين - عرض محاولات طلابهم
CREATE POLICY "Teachers can view student attempts from their school" ON bagrut_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('teacher', 'school_admin')
    AND p.school_id = bagrut_attempts.school_id
  )
);

-- 7. سياسة للمعلمين - تحديث المحاولات (للتصحيح)
CREATE POLICY "Teachers can grade attempts from their school" ON bagrut_attempts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('teacher', 'school_admin')
    AND p.school_id = bagrut_attempts.school_id
  )
);

-- ==============================================
-- سياسات RLS للجدول الجديد bagrut_question_grades
-- ==============================================

-- 8. السوبر آدمن يمكنه إدارة كل شيء
CREATE POLICY "Superadmins can manage all question grades" ON bagrut_question_grades
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- 9. المعلمون يمكنهم إدارة علامات طلابهم
CREATE POLICY "Teachers can manage question grades from their school" ON bagrut_question_grades
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN bagrut_attempts ba ON ba.id = bagrut_question_grades.attempt_id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('teacher', 'school_admin')
    AND p.school_id = ba.school_id
  )
);

-- 10. الطلاب يمكنهم رؤية علاماتهم المنشورة فقط
CREATE POLICY "Students can view their published question grades" ON bagrut_question_grades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bagrut_attempts ba
    WHERE ba.id = bagrut_question_grades.attempt_id
    AND ba.student_id = auth.uid()
    AND ba.is_result_published = true
  )
);

-- ==============================================
-- تحديث سياسة الطلاب على bagrut_attempts
-- ==============================================

-- 11. حذف السياسة القديمة للطلاب
DROP POLICY IF EXISTS "Students can manage their own attempts" ON bagrut_attempts;

-- 12. سياسة للطلاب - عرض محاولاتهم
CREATE POLICY "Students can view their own attempts" ON bagrut_attempts
FOR SELECT USING (student_id = auth.uid());

-- 13. سياسة للطلاب - إنشاء محاولات جديدة
CREATE POLICY "Students can create their own attempts" ON bagrut_attempts
FOR INSERT WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM bagrut_exams be
    WHERE be.id = exam_id
    AND be.is_published = true
    AND (be.available_from IS NULL OR be.available_from <= now())
    AND (be.available_until IS NULL OR be.available_until >= now())
  )
);

-- 14. سياسة للطلاب - تحديث محاولاتهم الجارية فقط
CREATE POLICY "Students can update their in_progress attempts" ON bagrut_attempts
FOR UPDATE USING (
  student_id = auth.uid() 
  AND status = 'in_progress'
);

-- ==============================================
-- إنشاء فهرس لتحسين الأداء
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_bagrut_question_grades_attempt ON bagrut_question_grades(attempt_id);
CREATE INDEX IF NOT EXISTS idx_bagrut_question_grades_question ON bagrut_question_grades(question_id);
CREATE INDEX IF NOT EXISTS idx_bagrut_attempts_student ON bagrut_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_bagrut_attempts_exam ON bagrut_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_bagrut_exams_published ON bagrut_exams(is_published) WHERE is_published = true;