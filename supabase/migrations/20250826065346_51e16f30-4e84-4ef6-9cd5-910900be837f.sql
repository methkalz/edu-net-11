-- Add question_sources field to exam_templates table
ALTER TABLE public.exam_templates 
ADD COLUMN question_sources jsonb DEFAULT '{"type": "random", "sections": []}'::jsonb;