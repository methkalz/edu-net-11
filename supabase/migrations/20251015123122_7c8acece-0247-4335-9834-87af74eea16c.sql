-- إضافة حقول Google Docs إلى جدول grade10_mini_projects
ALTER TABLE public.grade10_mini_projects
ADD COLUMN IF NOT EXISTS google_doc_id text,
ADD COLUMN IF NOT EXISTS google_doc_url text;

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_grade10_mini_projects_google_doc_id 
ON public.grade10_mini_projects(google_doc_id);

-- إضافة تعليق للتوثيق
COMMENT ON COLUMN public.grade10_mini_projects.google_doc_id IS 'معرّف مستند Google Docs المرتبط بالمشروع';
COMMENT ON COLUMN public.grade10_mini_projects.google_doc_url IS 'رابط مستند Google Docs المرتبط بالمشروع';