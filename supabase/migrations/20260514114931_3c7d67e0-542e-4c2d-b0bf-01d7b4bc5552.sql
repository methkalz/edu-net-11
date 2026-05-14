-- PDF Comparison Job Queue System (structural)
CREATE TABLE IF NOT EXISTS public.pdf_comparison_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('internal','repository','add_to_repo')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  file_index INTEGER,
  grade_level TEXT NOT NULL,
  comparison_type TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users NOT NULL,
  school_id UUID,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pcj_pending ON public.pdf_comparison_jobs(status, created_at)
  WHERE status IN ('pending','processing');
CREATE INDEX IF NOT EXISTS idx_pcj_batch ON public.pdf_comparison_jobs(batch_id, job_type);
CREATE INDEX IF NOT EXISTS idx_pcj_batch_status ON public.pdf_comparison_jobs(batch_id, job_type, status);

CREATE OR REPLACE FUNCTION public.update_pcj_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_pcj_updated_at ON public.pdf_comparison_jobs;
CREATE TRIGGER trg_pcj_updated_at
  BEFORE UPDATE ON public.pdf_comparison_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_pcj_updated_at();

ALTER TABLE public.pdf_comparison_results
  ADD COLUMN IF NOT EXISTS batch_status TEXT DEFAULT 'pending';
ALTER TABLE public.pdf_comparison_results
  ADD COLUMN IF NOT EXISTS embedding FLOAT8[];
ALTER TABLE public.pdf_comparison_results
  ADD COLUMN IF NOT EXISTS top_keywords TEXT[];

ALTER TABLE public.pdf_comparison_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_jobs" ON public.pdf_comparison_jobs;
CREATE POLICY "users_view_own_jobs" ON public.pdf_comparison_jobs
  FOR SELECT USING (requested_by = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_jobs" ON public.pdf_comparison_jobs;
CREATE POLICY "users_insert_own_jobs" ON public.pdf_comparison_jobs
  FOR INSERT WITH CHECK (requested_by = auth.uid());

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job claim RPC (race-safe via SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.claim_pdf_jobs(max_jobs INT)
RETURNS SETOF public.pdf_comparison_jobs
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.pdf_comparison_jobs
  SET status = 'processing', started_at = now(), attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM public.pdf_comparison_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT max_jobs
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.claim_pdf_jobs(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_pdf_jobs(INT) TO service_role;