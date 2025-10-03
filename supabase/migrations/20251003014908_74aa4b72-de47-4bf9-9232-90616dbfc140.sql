-- حذف الجدول إن وُجد
DROP TABLE IF EXISTS public.professional_documents CASCADE;

-- إنشاء جدول المستندات المهنية من جديد
CREATE TABLE public.professional_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  school_id UUID,
  google_doc_id TEXT,
  title TEXT NOT NULL DEFAULT 'مستند جديد',
  document_type TEXT NOT NULL DEFAULT 'general',
  content JSONB DEFAULT '{}'::jsonb,
  html_content TEXT,
  plain_text TEXT,
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_saved_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء indexes
CREATE INDEX ON public.professional_documents(user_id);
CREATE INDEX ON public.professional_documents(school_id);
CREATE INDEX ON public.professional_documents(document_type);
CREATE INDEX ON public.professional_documents(status);