-- إصلاح مشكلة infinite recursion في جدول professional_documents
-- حذف الجدول إذا كان موجوداً وإعادة إنشاؤه بشكل صحيح

DROP TABLE IF EXISTS public.professional_documents CASCADE;

-- إنشاء جدول professional_documents مع التصميم الصحيح
CREATE TABLE public.professional_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'::jsonb,
  html_content TEXT,
  plain_text TEXT,
  owner_id UUID NOT NULL,
  school_id UUID,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'school', 'public')),
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  allow_suggestions BOOLEAN NOT NULL DEFAULT true,
  version_number INTEGER NOT NULL DEFAULT 1,
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- فهارس لتحسين الأداء
  CONSTRAINT fk_professional_documents_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_professional_documents_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- إنشاء فهارس
CREATE INDEX idx_professional_documents_owner_id ON public.professional_documents(owner_id);
CREATE INDEX idx_professional_documents_school_id ON public.professional_documents(school_id);
CREATE INDEX idx_professional_documents_visibility ON public.professional_documents(visibility);
CREATE INDEX idx_professional_documents_created_at ON public.professional_documents(created_at);

-- تفعيل RLS
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;

-- إنشاء دالة آمنة للحصول على معرف المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- إنشاء دالة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS TEXT AS $$
  SELECT COALESCE(role::text, 'student') FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- إنشاء دالة للحصول على معرف مدرسة المستخدم
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- سياسات RLS آمنة (بدون infinite recursion)

-- سياسة للقراءة: المستخدمون يمكنهم رؤية مستنداتهم والمستندات المتاحة لهم
CREATE POLICY "أصحاب المستندات والمستندات المتاحة" 
ON public.professional_documents FOR SELECT 
USING (
  owner_id = get_current_user_id() 
  OR visibility = 'public' 
  OR (visibility = 'school' AND school_id = get_current_user_school_id())
);

-- سياسة للإدراج: المستخدمون يمكنهم إنشاء مستنداتهم فقط
CREATE POLICY "إنشاء المستندات الشخصية" 
ON public.professional_documents FOR INSERT 
WITH CHECK (owner_id = get_current_user_id());

-- سياسة للتحديث: المستخدمون يمكنهم تحديث مستنداتهم فقط
CREATE POLICY "تحديث المستندات الشخصية" 
ON public.professional_documents FOR UPDATE 
USING (owner_id = get_current_user_id()) 
WITH CHECK (owner_id = get_current_user_id());

-- سياسة للحذف: المستخدمون يمكنهم حذف مستنداتهم فقط
CREATE POLICY "حذف المستندات الشخصية" 
ON public.professional_documents FOR DELETE 
USING (owner_id = get_current_user_id());

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_professional_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_saved_at = now();
  
  -- حساب عدد الكلمات إذا كان هناك نص
  IF NEW.plain_text IS NOT NULL THEN
    NEW.word_count = array_length(string_to_array(trim(NEW.plain_text), ' '), 1);
    -- حساب عدد الصفحات (تقريبي: 250 كلمة لكل صفحة)
    NEW.page_count = GREATEST(1, CEIL(NEW.word_count::numeric / 250));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_professional_documents_updated_at
  BEFORE UPDATE ON public.professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_documents_updated_at();