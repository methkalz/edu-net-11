-- إضافة عمود segments_metadata لتخزين معلومات استخراج segments on-demand
ALTER TABLE pdf_comparison_results
ADD COLUMN IF NOT EXISTS segments_metadata JSONB DEFAULT '{}'::jsonb;