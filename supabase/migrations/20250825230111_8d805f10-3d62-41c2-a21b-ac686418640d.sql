-- إضافة نوع ملف جديد "مواد" إلى جدول grade11_documents

-- إزالة قيود التحقق الموجودة على حقل category
DO $$ 
BEGIN
    -- محاولة إزالة القيد إذا كان موجود
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%category%' 
        AND table_name = 'grade11_documents'
        AND constraint_type = 'CHECK'
    ) THEN
        ALTER TABLE grade11_documents DROP CONSTRAINT IF EXISTS grade11_documents_category_check;
    END IF;
END $$;

-- إضافة قيد جديد يتضمن "materials" 
ALTER TABLE grade11_documents 
ADD CONSTRAINT grade11_documents_category_check 
CHECK (category IN ('bagrut_exam', 'worksheets', 'exams', 'materials'));