-- إضافة الأعمدة المفقودة لجدول grade10_documents
ALTER TABLE grade10_documents 
ADD COLUMN order_index integer DEFAULT 0,
ADD COLUMN is_visible boolean DEFAULT true,
ADD COLUMN allowed_roles text[] DEFAULT ARRAY['all'::text],
ADD COLUMN is_active boolean DEFAULT true,
ADD COLUMN published_at timestamp with time zone DEFAULT now(),
ADD COLUMN category text DEFAULT 'materials',
ADD COLUMN grade_level text DEFAULT '10';