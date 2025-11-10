-- ============================================
-- FIX: Add missing page_count column
-- ============================================

-- Add page_count column if it doesn't exist
ALTER TABLE public.pdf_comparison_repository 
ADD COLUMN IF NOT EXISTS page_count INTEGER;

-- Add index for better performance on page_count filtering
CREATE INDEX IF NOT EXISTS idx_pdf_repository_page_count 
ON public.pdf_comparison_repository (page_count) 
WHERE page_count IS NOT NULL;