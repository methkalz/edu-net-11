-- Add explanation column to question_bank table
ALTER TABLE question_bank ADD COLUMN explanation TEXT;

-- Add comment for documentation
COMMENT ON COLUMN question_bank.explanation IS 'شرح الإجابة الصحيحة للسؤال - يُستخدم لتوضيح الإجابة الصحيحة وتعليم الطالب';