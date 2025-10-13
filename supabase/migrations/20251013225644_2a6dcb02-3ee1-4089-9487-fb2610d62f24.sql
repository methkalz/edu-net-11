-- إضافة حقول مستند جوجل إلى جدول grade12_final_projects
ALTER TABLE public.grade12_final_projects
ADD COLUMN IF NOT EXISTS google_doc_id TEXT,
ADD COLUMN IF NOT EXISTS google_doc_url TEXT;

-- إضافة تعليق توضيحي للحقول
COMMENT ON COLUMN public.grade12_final_projects.google_doc_id IS 'معرف مستند جوجل المرتبط بالمشروع';
COMMENT ON COLUMN public.grade12_final_projects.google_doc_url IS 'رابط مستند جوجل المرتبط بالمشروع';

-- إنشاء فهرس للبحث السريع بمعرف المستند
CREATE INDEX IF NOT EXISTS idx_grade12_projects_google_doc_id 
ON public.grade12_final_projects(google_doc_id) 
WHERE google_doc_id IS NOT NULL;