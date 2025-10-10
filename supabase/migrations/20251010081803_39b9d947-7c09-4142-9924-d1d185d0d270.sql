-- حذف الـ policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Students can view their own exam attempt questions" ON public.exam_attempt_questions;
DROP POLICY IF EXISTS "Students can view published exams for their grade and class" ON public.teacher_exams;
DROP POLICY IF EXISTS "Students can create their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can view their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can update their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can create their own exam attempt questions" ON public.exam_attempt_questions;
DROP POLICY IF EXISTS "Students can update their own exam attempt questions" ON public.exam_attempt_questions;

-- Policy للطلاب لقراءة الاختبارات المنشورة والمخصصة لهم
CREATE POLICY "Students can view published exams for their grade and class"
ON public.teacher_exams
FOR SELECT
TO authenticated
USING (
  status = 'published' 
  AND (
    EXISTS (
      SELECT 1
      FROM students s
      JOIN class_students cs ON cs.student_id = s.id
      JOIN classes c ON c.id = cs.class_id
      JOIN grade_levels gl ON gl.id = c.grade_level_id
      WHERE s.user_id = auth.uid()
        AND gl.code = ANY(teacher_exams.grade_levels)
        AND (
          teacher_exams.target_class_ids IS NULL 
          OR array_length(teacher_exams.target_class_ids, 1) IS NULL
          OR cs.class_id = ANY(teacher_exams.target_class_ids)
        )
    )
  )
);

-- Policy للطلاب لإنشاء محاولات الاختبار
CREATE POLICY "Students can create their own exam attempts"
ON public.exam_attempts
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND teacher_exam_id IS NOT NULL
);

-- Policy للطلاب لقراءة محاولاتهم
CREATE POLICY "Students can view their own exam attempts"
ON public.exam_attempts
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
);

-- Policy للطلاب لتحديث محاولاتهم (فقط أثناء التقديم)
CREATE POLICY "Students can update their own exam attempts"
ON public.exam_attempts
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()
)
WITH CHECK (
  student_id = auth.uid()
);

-- Policy للطلاب لإنشاء إجابات
CREATE POLICY "Students can create their own exam attempt questions"
ON public.exam_attempt_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE id = exam_attempt_questions.attempt_id
      AND student_id = auth.uid()
  )
);

-- Policy للطلاب لقراءة إجاباتهم
CREATE POLICY "Students can view their own exam attempt questions"
ON public.exam_attempt_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE id = exam_attempt_questions.attempt_id
      AND student_id = auth.uid()
  )
);

-- Policy للطلاب لتحديث إجاباتهم (فقط أثناء الاختبار)
CREATE POLICY "Students can update their own exam attempt questions"
ON public.exam_attempt_questions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE id = exam_attempt_questions.attempt_id
      AND student_id = auth.uid()
      AND status = 'in_progress'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE id = exam_attempt_questions.attempt_id
      AND student_id = auth.uid()
      AND status = 'in_progress'
  )
);