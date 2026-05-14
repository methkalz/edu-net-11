
-- Cancel currently stuck jobs
UPDATE public.pdf_comparison_jobs
SET status = 'failed',
    error_message = COALESCE(error_message, '') || ' [auto-cancelled: stuck in old single-job architecture]',
    completed_at = now()
WHERE status = 'processing'
  AND started_at < now() - interval '1 minute';

UPDATE public.pdf_comparison_results
SET batch_status = 'cancelled',
    status = 'safe'
WHERE batch_status IN ('pending', 'queued')
  AND batch_id IN (
    SELECT DISTINCT batch_id FROM public.pdf_comparison_jobs
    WHERE error_message LIKE '%auto-cancelled%'
  );

-- New columns on jobs
ALTER TABLE public.pdf_comparison_jobs
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS worker_id uuid,
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_pdf_jobs_status_started
  ON public.pdf_comparison_jobs (status, processing_started_at)
  WHERE status IN ('pending', 'processing');

-- Progress columns on results
ALTER TABLE public.pdf_comparison_results
  ADD COLUMN IF NOT EXISTS progress_percent int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_phase text DEFAULT 'pending';

-- Shards table
CREATE TABLE IF NOT EXISTS public.pdf_comparison_shards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  shard_index int NOT NULL,
  pair_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (batch_id, shard_index)
);
CREATE INDEX IF NOT EXISTS idx_pdf_shards_batch ON public.pdf_comparison_shards (batch_id, status);
ALTER TABLE public.pdf_comparison_shards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view shards"
ON public.pdf_comparison_shards FOR SELECT TO authenticated
USING (public.get_user_role() = 'superadmin'::app_role);

-- Texts table
CREATE TABLE IF NOT EXISTS public.pdf_comparison_texts (
  result_id uuid PRIMARY KEY,
  batch_id uuid NOT NULL,
  extracted_text text NOT NULL,
  embedding vector(1024),
  top_keywords text[] DEFAULT '{}',
  word_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pdf_texts_batch ON public.pdf_comparison_texts (batch_id);
ALTER TABLE public.pdf_comparison_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view texts"
ON public.pdf_comparison_texts FOR SELECT TO authenticated
USING (public.get_user_role() = 'superadmin'::app_role);

-- claim_pdf_jobs with stuck-recovery
CREATE OR REPLACE FUNCTION public.claim_pdf_jobs(max_jobs integer)
RETURNS SETOF pdf_comparison_jobs
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  WITH recovered AS (
    UPDATE public.pdf_comparison_jobs
    SET status = 'pending',
        processing_started_at = NULL,
        worker_id = NULL,
        error_message = COALESCE(error_message, '') || ' [auto-recovered after timeout]'
    WHERE status = 'processing'
      AND processing_started_at IS NOT NULL
      AND processing_started_at < now() - interval '60 seconds'
      AND attempts < max_attempts
    RETURNING id
  ),
  claimed AS (
    UPDATE public.pdf_comparison_jobs
    SET status = 'processing',
        started_at = COALESCE(started_at, now()),
        processing_started_at = now(),
        worker_id = gen_random_uuid(),
        attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM public.pdf_comparison_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT max_jobs
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  )
  SELECT * FROM claimed;
$function$;

-- Batch progress aggregator
CREATE OR REPLACE FUNCTION public.compute_batch_progress(p_batch_id uuid)
RETURNS TABLE (
  total_files int,
  completed_files int,
  total_jobs int,
  completed_jobs int,
  failed_jobs int,
  pending_jobs int,
  processing_jobs int,
  progress_percent int,
  current_phase text
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH r AS (
    SELECT count(*) AS total, count(*) FILTER (WHERE batch_status = 'completed') AS done
    FROM public.pdf_comparison_results WHERE batch_id = p_batch_id
  ),
  j AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE status = 'completed') AS done,
      count(*) FILTER (WHERE status = 'failed') AS failed,
      count(*) FILTER (WHERE status = 'pending') AS pending,
      count(*) FILTER (WHERE status = 'processing') AS processing,
      MIN(job_type) FILTER (WHERE status IN ('pending','processing')) AS active_type
    FROM public.pdf_comparison_jobs WHERE batch_id = p_batch_id
  )
  SELECT
    r.total::int,
    r.done::int,
    j.total::int,
    j.done::int,
    j.failed::int,
    j.pending::int,
    j.processing::int,
    CASE WHEN j.total = 0 THEN 0
         ELSE LEAST(100, ((j.done * 100) / GREATEST(j.total, 1)))::int END,
    COALESCE(j.active_type, CASE WHEN j.done = j.total AND j.total > 0 THEN 'done' ELSE 'pending' END)
  FROM r, j;
$$;

GRANT EXECUTE ON FUNCTION public.compute_batch_progress(uuid) TO authenticated;
