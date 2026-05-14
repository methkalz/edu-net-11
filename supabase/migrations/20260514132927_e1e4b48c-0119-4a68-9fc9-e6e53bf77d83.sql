ALTER TABLE public.pdf_comparison_results
  ADD COLUMN IF NOT EXISTS compared_file_pages INTEGER DEFAULT 1;