-- Drop the existing unique constraint on text_hash only
ALTER TABLE pdf_comparison_repository DROP CONSTRAINT IF EXISTS unique_file_hash;

-- Add a new unique constraint on the combination of text_hash, grade_level, and project_type
-- This allows the same file to exist in different grades or project types
ALTER TABLE pdf_comparison_repository 
ADD CONSTRAINT unique_file_per_grade_and_type 
UNIQUE (text_hash, grade_level, project_type);