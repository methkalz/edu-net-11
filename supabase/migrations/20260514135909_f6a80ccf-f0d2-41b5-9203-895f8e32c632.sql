ALTER TABLE public.pdf_comparison_jobs
  DROP CONSTRAINT IF EXISTS pdf_comparison_jobs_job_type_check;

ALTER TABLE public.pdf_comparison_jobs
  ADD CONSTRAINT pdf_comparison_jobs_job_type_check
  CHECK (job_type IN (
    'internal',
    'internal_shard',
    'aggregate_internal',
    'repository',
    'add_to_repo',
    'prepare_file'
  ));