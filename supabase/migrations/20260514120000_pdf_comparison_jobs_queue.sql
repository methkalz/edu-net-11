-- =============================================
-- PDF Comparison Job Queue System
-- Replaces synchronous batch processing with
-- async background queue via pg_cron
-- =============================================

-- 1. جدول طابور المهام
CREATE TABLE IF NOT EXISTS pdf_comparison_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('internal', 'repository', 'add_to_repo')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
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

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_pcj_pending ON pdf_comparison_jobs(status, created_at)
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_pcj_batch ON pdf_comparison_jobs(batch_id, job_type);
CREATE INDEX IF NOT EXISTS idx_pcj_batch_status ON pdf_comparison_jobs(batch_id, job_type, status);

-- trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_pcj_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pcj_updated_at
  BEFORE UPDATE ON pdf_comparison_jobs
  FOR EACH ROW EXECUTE FUNCTION update_pcj_updated_at();

-- 2. أعمدة إضافية على pdf_comparison_results
ALTER TABLE pdf_comparison_results
  ADD COLUMN IF NOT EXISTS batch_status TEXT DEFAULT 'pending';

ALTER TABLE pdf_comparison_results
  ADD COLUMN IF NOT EXISTS embedding FLOAT8[];

ALTER TABLE pdf_comparison_results
  ADD COLUMN IF NOT EXISTS top_keywords TEXT[];

-- 3. RLS على جدول المهام
ALTER TABLE pdf_comparison_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_jobs" ON pdf_comparison_jobs
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "users_insert_own_jobs" ON pdf_comparison_jobs
  FOR INSERT WITH CHECK (requested_by = auth.uid());

-- Service role (used by pg_cron processor) bypasses RLS automatically

-- 4. pg_cron setup
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- جدولة المعالج كل 10 ثوانٍ
-- ملاحظة: pg_cron يدعم ثوانٍ فقط في Supabase Pro+
-- إذا لم يدعم، يمكن استخدام '* * * * *' (كل دقيقة) كبديل
DO $$
BEGIN
  PERFORM cron.schedule(
    'process-pdf-comparison-jobs',
    '10 seconds',
    format(
      'SELECT net.http_post(url := %L || %L, headers := %L::jsonb, body := %L::jsonb)',
      current_setting('app.settings.supabase_url', true),
      '/functions/v1/pdf-process-jobs',
      json_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
        'Content-Type', 'application/json'
      )::text,
      '{}'
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule failed (may need manual setup): %', SQLERRM;
END;
$$;
