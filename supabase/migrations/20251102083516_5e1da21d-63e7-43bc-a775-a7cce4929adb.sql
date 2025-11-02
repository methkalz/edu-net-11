-- السماح برفع ملفات بنفس المحتوى (نفس text_hash)
-- إزالة UNIQUE INDEX على text_hash والاحتفاظ بـ INDEX عادي

-- حذف UNIQUE INDEX
DROP INDEX IF EXISTS pdf_comparison_repository_text_hash_key;

-- إنشاء INDEX عادي لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_pdf_comparison_repository_text_hash 
ON pdf_comparison_repository(text_hash);