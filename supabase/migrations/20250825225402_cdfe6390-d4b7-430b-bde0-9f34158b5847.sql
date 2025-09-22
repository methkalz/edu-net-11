-- تحديث تواريخ الملفات المرفوعة حديثاً (في آخر 24 ساعة) إلى قبل شهر و10 أيام

UPDATE grade11_documents 
SET created_at = NOW() - INTERVAL '1 month 10 days',
    updated_at = NOW() - INTERVAL '1 month 10 days',
    published_at = NOW() - INTERVAL '1 month 10 days'
WHERE created_at > NOW() - INTERVAL '24 hours';