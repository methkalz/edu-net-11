-- إصلاح Foreign Key لحذف آمن للملفات من المستودع
-- حذف الـ constraint القديم
ALTER TABLE pdf_comparison_results 
DROP CONSTRAINT IF EXISTS pdf_comparison_results_repository_file_id_fkey;

-- إضافة constraint جديد مع ON DELETE SET NULL
-- هذا يسمح بحذف الملف من المستودع مع الحفاظ على السجلات التاريخية
ALTER TABLE pdf_comparison_results 
ADD CONSTRAINT pdf_comparison_results_repository_file_id_fkey 
FOREIGN KEY (repository_file_id) 
REFERENCES pdf_comparison_repository(id) 
ON DELETE SET NULL;