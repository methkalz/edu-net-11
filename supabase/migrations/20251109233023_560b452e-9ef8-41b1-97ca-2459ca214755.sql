-- تعديل جدول pdf_comparison_results لدعم النهج الهجين
ALTER TABLE pdf_comparison_results
ADD COLUMN IF NOT EXISTS top_matched_segments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS segments_file_path TEXT,
ADD COLUMN IF NOT EXISTS segments_processing_status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS segments_count INTEGER DEFAULT 0;

-- إنشاء index على segments_count للبحث السريع
CREATE INDEX IF NOT EXISTS idx_pdf_comparison_segments_count 
ON pdf_comparison_results(segments_count) 
WHERE segments_count > 0;