-- تحديث تواريخ الملفات من نوع "مواد" إلى قبل شهرين

UPDATE grade11_documents 
SET created_at = NOW() - INTERVAL '2 months',
    updated_at = NOW() - INTERVAL '2 months',
    published_at = NOW() - INTERVAL '2 months'
WHERE category = 'materials';