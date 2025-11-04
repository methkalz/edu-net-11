-- إضافة عمود total_files_compared إلى جدول pdf_comparison_results
ALTER TABLE public.pdf_comparison_results 
ADD COLUMN IF NOT EXISTS total_files_compared INTEGER DEFAULT 0;

-- إضافة تعليق على العمود
COMMENT ON COLUMN public.pdf_comparison_results.total_files_compared IS 'إجمالي عدد الملفات التي تمت مقارنتها في المستودع';