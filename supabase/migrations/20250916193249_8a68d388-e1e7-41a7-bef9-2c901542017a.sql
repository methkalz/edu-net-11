-- إنشاء جدول المستندات الاحترافية
CREATE TABLE public.professional_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  html_content TEXT,
  plain_text TEXT,
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  
  -- معلومات الملكية والمؤسسة
  owner_id UUID NOT NULL,
  school_id UUID,
  
  -- الحالة والصلاحيات
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'submitted')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'school', 'public')),
  
  -- إعدادات التحرير
  allow_comments BOOLEAN DEFAULT true,
  allow_suggestions BOOLEAN DEFAULT true,
  version_number INTEGER DEFAULT 1,
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- بيانات إضافية
  settings JSONB DEFAULT '{"page_format": "A4", "margins": {"top": 72, "bottom": 72, "left": 72, "right": 72}, "font_family": "Arial", "font_size": 12}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- إنشاء جدول التعليقات والمراجعات
CREATE TABLE public.document_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.professional_documents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  
  -- محتوى التعليق
  content TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'comment' CHECK (comment_type IN ('comment', 'suggestion', 'approval', 'request_change')),
  
  -- الموقع في المستند
  position_start INTEGER,
  position_end INTEGER,
  selected_text TEXT,
  
  -- حالة التعليق
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'deleted')),
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- رد على تعليق آخر
  parent_comment_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE
);

-- إنشاء جدول نشاطات المستند (للتعاون المباشر)
CREATE TABLE public.document_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.professional_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- نوع النشاط
  activity_type TEXT NOT NULL CHECK (activity_type IN ('view', 'edit', 'comment', 'save', 'export', 'share')),
  action_details JSONB DEFAULT '{}'::jsonb,
  
  -- التوقيت
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- بيانات إضافية للتتبع
  user_agent TEXT,
  ip_address INET
);

-- إنشاء جدول المشاركات والصلاحيات
CREATE TABLE public.document_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.professional_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- نوع الصلاحية
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'comment', 'suggest', 'edit', 'admin')),
  
  -- من منح الصلاحية
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- حالة الصلاحية
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(document_id, user_id)
);

-- إنشاء جدول الإصدارات (للتتبع وإمكانية الاستعادة)
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.professional_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- محتوى الإصدار
  content JSONB NOT NULL,
  html_content TEXT,
  
  -- معلومات الإصدار
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT,
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(document_id, version_number)
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستندات
CREATE POLICY "مالكو المستندات يمكنهم إدارتها بالكامل" 
ON public.professional_documents 
FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم رؤية المستندات المشتركة معهم"
ON public.professional_documents 
FOR SELECT 
USING (
  owner_id = auth.uid() OR
  visibility = 'public' OR
  (visibility = 'school' AND school_id = get_user_school_id()) OR
  EXISTS (
    SELECT 1 FROM public.document_permissions dp 
    WHERE dp.document_id = id AND dp.user_id = auth.uid() 
    AND dp.is_active = true 
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);

-- سياسات الأمان للتعليقات
CREATE POLICY "أصحاب التعليقات يمكنهم إدارتها"
ON public.document_comments 
FOR ALL 
USING (author_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم رؤية تعليقات المستندات المتاحة لهم"
ON public.document_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.professional_documents pd 
    WHERE pd.id = document_id 
    AND (
      pd.owner_id = auth.uid() OR
      pd.visibility = 'public' OR
      (pd.visibility = 'school' AND pd.school_id = get_user_school_id()) OR
      EXISTS (
        SELECT 1 FROM public.document_permissions dp 
        WHERE dp.document_id = pd.id AND dp.user_id = auth.uid() 
        AND dp.is_active = true
      )
    )
  )
);

CREATE POLICY "المستخدمون يمكنهم إضافة تعليقات للمستندات المسموحة"
ON public.document_comments 
FOR INSERT 
WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.professional_documents pd 
    WHERE pd.id = document_id 
    AND pd.allow_comments = true
    AND (
      pd.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.document_permissions dp 
        WHERE dp.document_id = pd.id AND dp.user_id = auth.uid() 
        AND dp.permission_type IN ('comment', 'suggest', 'edit', 'admin')
        AND dp.is_active = true
      )
    )
  )
);

-- سياسات النشاطات
CREATE POLICY "المستخدمون يمكنهم إضافة نشاطاتهم"
ON public.document_activities 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "أصحاب المستندات يمكنهم رؤية جميع النشاطات"
ON public.document_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.professional_documents pd 
    WHERE pd.id = document_id AND pd.owner_id = auth.uid()
  )
);

-- سياسات الصلاحيات
CREATE POLICY "أصحاب المستندات يمكنهم إدارة الصلاحيات"
ON public.document_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.professional_documents pd 
    WHERE pd.id = document_id AND pd.owner_id = auth.uid()
  )
);

CREATE POLICY "المستخدمون يمكنهم رؤية صلاحياتهم"
ON public.document_permissions 
FOR SELECT 
USING (user_id = auth.uid());

-- سياسات الإصدارات
CREATE POLICY "أصحاب المستندات يمكنهم إدارة الإصدارات"
ON public.document_versions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.professional_documents pd 
    WHERE pd.id = document_id AND pd.owner_id = auth.uid()
  )
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_professional_documents_owner ON public.professional_documents(owner_id);
CREATE INDEX idx_professional_documents_school ON public.professional_documents(school_id);
CREATE INDEX idx_professional_documents_status ON public.professional_documents(status);
CREATE INDEX idx_professional_documents_updated ON public.professional_documents(updated_at DESC);

CREATE INDEX idx_document_comments_document ON public.document_comments(document_id);
CREATE INDEX idx_document_comments_author ON public.document_comments(author_id);
CREATE INDEX idx_document_comments_status ON public.document_comments(status);

CREATE INDEX idx_document_activities_document ON public.document_activities(document_id);
CREATE INDEX idx_document_activities_user ON public.document_activities(user_id);
CREATE INDEX idx_document_activities_created ON public.document_activities(created_at DESC);

CREATE INDEX idx_document_permissions_document ON public.document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON public.document_permissions(user_id);

CREATE INDEX idx_document_versions_document ON public.document_versions(document_id);
CREATE INDEX idx_document_versions_number ON public.document_versions(document_id, version_number);

-- إنشاء وظائف لتحديث التواريخ تلقائياً
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_saved_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_documents_updated_at
  BEFORE UPDATE ON public.professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON public.document_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- وظيفة لحساب عدد الكلمات والصفحات
CREATE OR REPLACE FUNCTION update_document_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- حساب عدد الكلمات من النص العادي
  IF NEW.plain_text IS NOT NULL THEN
    NEW.word_count = array_length(string_to_array(trim(NEW.plain_text), ' '), 1);
    -- حساب عدد الصفحات (تقريبي: 250 كلمة لكل صفحة)
    NEW.page_count = GREATEST(1, CEIL(NEW.word_count::numeric / 250));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_stats_trigger
  BEFORE INSERT OR UPDATE ON public.professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_stats();