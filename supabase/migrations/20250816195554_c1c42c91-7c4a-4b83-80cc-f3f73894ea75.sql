-- إنشاء جدول السنوات الدراسية
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_at_utc TIMESTAMPTZ NOT NULL,
  end_at_utc TIMESTAMPTZ NOT NULL,
  granularity TEXT NOT NULL CHECK (granularity IN ('year', 'month', 'day')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID NOT NULL,
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- التحقق من أن تاريخ البداية أقل من تاريخ النهاية
  CONSTRAINT start_before_end CHECK (start_at_utc < end_at_utc)
);

-- إنشاء جدول سجل التدقيق
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  payload_json JSONB DEFAULT '{}',
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_academic_years_status ON public.academic_years(status);
CREATE INDEX idx_academic_years_dates ON public.academic_years(start_at_utc, end_at_utc);
CREATE INDEX idx_academic_years_created_by ON public.academic_years(created_by);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at_utc);

-- تفعيل RLS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للسنوات الدراسية
-- المشرف العام: صلاحية كاملة
CREATE POLICY "Superadmins can manage academic years" 
ON public.academic_years 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

-- بقية المستخدمين: قراءة فقط للسنوات النشطة
CREATE POLICY "Users can view active academic years" 
ON public.academic_years 
FOR SELECT 
USING (status = 'active' AND get_user_role() IN ('school_admin', 'teacher', 'student', 'parent'));

-- سياسات RLS لسجل التدقيق
-- المشرف العام فقط يمكنه رؤية سجل التدقيق
CREATE POLICY "Superadmins can view audit log" 
ON public.audit_log 
FOR SELECT 
USING (get_user_role() = 'superadmin'::app_role);

-- المشرف العام فقط يمكنه إدراج في سجل التدقيق
CREATE POLICY "Superadmins can insert audit log" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (get_user_role() = 'superadmin'::app_role AND actor_user_id = auth.uid());

-- إنشاء trigger لتحديث updated_at_utc
CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إدراج بيانات تجريبية
INSERT INTO public.academic_years (name, start_at_utc, end_at_utc, granularity, created_by) 
VALUES 
  ('2025-2026', '2025-01-01 00:00:00Z', '2026-12-31 23:59:59Z', 'year', '00000000-0000-0000-0000-000000000000'),
  ('2026-2027', '2026-01-01 00:00:00Z', '2027-12-31 23:59:59Z', 'year', '00000000-0000-0000-0000-000000000000');

-- تفعيل الـ realtime للجداول
ALTER TABLE public.academic_years REPLICA IDENTITY FULL;
ALTER TABLE public.audit_log REPLICA IDENTITY FULL;