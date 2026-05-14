UPDATE public.pdf_comparison_jobs
SET status='failed', error_message='Cancelled — re-shard required', completed_at=now()
WHERE batch_id='67508c6c-b545-49ff-b279-eb8a0ab45ea7' AND status IN ('pending','processing');

UPDATE public.pdf_comparison_results
SET status='cancelled'
WHERE batch_id='67508c6c-b545-49ff-b279-eb8a0ab45ea7' AND status='pending';