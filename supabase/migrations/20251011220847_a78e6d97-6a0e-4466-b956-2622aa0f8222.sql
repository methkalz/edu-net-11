-- إضافة حقول لمصدر الأسئلة ودرجة الصعوبة في جدول exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS question_source_type text DEFAULT 'random' CHECK (question_source_type IN ('random', 'specific_sections')),
ADD COLUMN IF NOT EXISTS selected_sections uuid[] DEFAULT ARRAY[]::uuid[],
ADD COLUMN IF NOT EXISTS difficulty_levels text[] DEFAULT ARRAY[]::text[] CHECK (
  difficulty_levels <@ ARRAY['easy', 'medium', 'hard']::text[]
);