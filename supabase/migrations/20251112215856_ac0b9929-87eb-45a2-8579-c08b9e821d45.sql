-- إنشاء جدول trusted_cdn_domains لإدارة CDNs الموثوقة
CREATE TABLE IF NOT EXISTS public.trusted_cdn_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_domain_format CHECK (domain ~* '^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$')
);

-- إنشاء index لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_trusted_cdn_domains_active ON public.trusted_cdn_domains(is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_cdn_domains_domain ON public.trusted_cdn_domains(domain);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_trusted_cdn_domains_updated_at
  BEFORE UPDATE ON public.trusted_cdn_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- تمكين RLS
ALTER TABLE public.trusted_cdn_domains ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة CDNs النشطة (للـ validation)
CREATE POLICY "Anyone can view active CDNs"
  ON public.trusted_cdn_domains
  FOR SELECT
  USING (is_active = true);

-- السماح للسوبر آدمن فقط برؤية جميع CDNs (حتى غير النشطة)
CREATE POLICY "Super admins can view all CDNs"
  ON public.trusted_cdn_domains
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'::app_role
    )
  );

-- السماح للسوبر آدمن فقط بإضافة CDNs جديدة
CREATE POLICY "Super admins can insert CDNs"
  ON public.trusted_cdn_domains
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'::app_role
    )
  );

-- السماح للسوبر آدمن فقط بتحديث CDNs
CREATE POLICY "Super admins can update CDNs"
  ON public.trusted_cdn_domains
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'::app_role
    )
  );

-- السماح للسوبر آدمن فقط بحذف CDNs
CREATE POLICY "Super admins can delete CDNs"
  ON public.trusted_cdn_domains
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'::app_role
    )
  );

-- إضافة CDNs موثوقة افتراضية
INSERT INTO public.trusted_cdn_domains (domain, description, is_active) VALUES
  ('cdnjs.cloudflare.com', 'Cloudflare CDN - مكتبة شاملة للمكتبات JavaScript', true),
  ('cdn.jsdelivr.net', 'jsDelivr - CDN مفتوح المصدر للمشاريع على npm و GitHub', true),
  ('unpkg.com', 'unpkg - CDN سريع لكل شيء على npm', true),
  ('cdn.tailwindcss.com', 'Tailwind CSS CDN الرسمي', true),
  ('fonts.googleapis.com', 'Google Fonts API', true),
  ('fonts.gstatic.com', 'Google Fonts Static Resources', true)
ON CONFLICT (domain) DO NOTHING;