-- تحديث تواريخ رفع الملفات الموجودة إلى تاريخ قبل شهر ونصف من الآن

UPDATE grade11_documents 
SET created_at = NOW() - INTERVAL '1.5 months',
    updated_at = NOW() - INTERVAL '1.5 months',
    published_at = NOW() - INTERVAL '1.5 months'
WHERE created_at IS NOT NULL;