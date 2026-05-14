DROP POLICY IF EXISTS "users_delete_own_jobs" ON pdf_comparison_jobs;
CREATE POLICY "users_delete_own_jobs" ON pdf_comparison_jobs
  FOR DELETE USING (requested_by = auth.uid());