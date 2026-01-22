-- Add immutable sequential exam number for Bagrut exams
ALTER TABLE public.bagrut_exams
ADD COLUMN IF NOT EXISTS exam_number BIGINT;

-- Create a sequence and set default (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND c.relname = 'bagrut_exams_exam_number_seq' AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.bagrut_exams_exam_number_seq;
  END IF;
END $$;

ALTER TABLE public.bagrut_exams
ALTER COLUMN exam_number SET DEFAULT nextval('public.bagrut_exams_exam_number_seq');

-- Backfill existing rows with stable order based on created_at then id
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.bagrut_exams
  WHERE exam_number IS NULL
)
UPDATE public.bagrut_exams e
SET exam_number = ranked.rn
FROM ranked
WHERE e.id = ranked.id;

-- Ensure sequence is ahead of max
SELECT setval(
  'public.bagrut_exams_exam_number_seq',
  GREATEST((SELECT COALESCE(MAX(exam_number), 0) FROM public.bagrut_exams), 0)
);

-- Enforce uniqueness and not-null
ALTER TABLE public.bagrut_exams
ALTER COLUMN exam_number SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bagrut_exams_exam_number_unique'
  ) THEN
    ALTER TABLE public.bagrut_exams
    ADD CONSTRAINT bagrut_exams_exam_number_unique UNIQUE (exam_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bagrut_exams_exam_number ON public.bagrut_exams (exam_number);
