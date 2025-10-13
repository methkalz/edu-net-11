-- إضافة حقل category لتصنيف أسئلة المعلم في مجموعات
ALTER TABLE teacher_custom_questions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'عام';

-- إنشاء index لتسريع البحث حسب المعلم والتصنيف
CREATE INDEX IF NOT EXISTS idx_teacher_questions_category 
ON teacher_custom_questions(teacher_id, category) 
WHERE is_active = true;

-- إضافة سياسة RLS للطلاب لقراءة أسئلة المعلم في امتحاناتهم فقط
CREATE POLICY "Students can view teacher questions in their exams"
ON teacher_custom_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exam_questions eq
    JOIN exams e ON e.id = eq.exam_id
    JOIN exam_attempts ea ON ea.exam_id = e.id
    WHERE eq.custom_question_id = teacher_custom_questions.id
      AND ea.student_id = auth.uid()
      AND ea.status IN ('in_progress', 'submitted')
  )
);