-- إنهاء shards العالقة بنتائج فارغة (سيُكملها aggregate بدون أزواج تلك الـ shards)
INSERT INTO public.pdf_comparison_shards (batch_id, shard_index, pair_results, status, completed_at)
SELECT
  j.batch_id,
  (j.payload->>'shard_index')::int,
  '[]'::jsonb,
  'completed',
  now()
FROM public.pdf_comparison_jobs j
WHERE j.batch_id = '25cac813-57ad-44a0-ac26-9c5edc97874a'
  AND j.job_type = 'internal_shard'
  AND j.status IN ('pending','processing')
ON CONFLICT (batch_id, shard_index) DO NOTHING;

-- علامة هذه الـ jobs كـ completed (لكي لا يلتقطها cron)
UPDATE public.pdf_comparison_jobs
SET status='completed', completed_at=now(), error_message='Auto-completed (legacy stuck batch)'
WHERE batch_id = '25cac813-57ad-44a0-ac26-9c5edc97874a'
  AND job_type = 'internal_shard'
  AND status IN ('pending','processing');

-- إعادة جدولة الـ aggregate
UPDATE public.pdf_comparison_jobs
SET status='pending', processing_started_at=NULL, attempts=0, error_message=NULL
WHERE batch_id = '25cac813-57ad-44a0-ac26-9c5edc97874a'
  AND job_type = 'aggregate_internal';