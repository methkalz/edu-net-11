-- Remove category references from question_bank table
ALTER TABLE public.question_bank DROP COLUMN IF EXISTS category_id;

-- Drop the question_categories table if it exists
DROP TABLE IF EXISTS public.question_categories CASCADE;