-- Enable REPLICA IDENTITY FULL for pdf_comparison_results to ensure realtime updates work correctly
ALTER TABLE public.pdf_comparison_results REPLICA IDENTITY FULL;