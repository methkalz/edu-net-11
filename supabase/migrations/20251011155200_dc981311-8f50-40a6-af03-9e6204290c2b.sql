-- Make exam_id nullable and allow questions to reference teacher_exams instead
ALTER TABLE exam_questions ALTER COLUMN exam_id DROP NOT NULL;

-- Add teacher_exam_id column if it doesn't exist (will fail silently if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_questions' 
    AND column_name = 'teacher_exam_id'
  ) THEN
    ALTER TABLE exam_questions ADD COLUMN teacher_exam_id UUID REFERENCES teacher_exams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraint to ensure either exam_id or teacher_exam_id is present
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_either_exam_or_teacher_exam;
ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_either_exam_or_teacher_exam 
  CHECK (exam_id IS NOT NULL OR teacher_exam_id IS NOT NULL);