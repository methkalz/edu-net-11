-- =============================================
-- Add compared_file_pages column to pdf_comparison_results
-- Restores page-aware length similarity calculation
-- (matches the old pdf-compare-batch behavior)
-- =============================================

ALTER TABLE pdf_comparison_results
  ADD COLUMN IF NOT EXISTS compared_file_pages INTEGER DEFAULT 1;
