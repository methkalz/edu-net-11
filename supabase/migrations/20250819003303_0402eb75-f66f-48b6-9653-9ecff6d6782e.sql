-- تحديث سياسة عرض الأحداث لتشمل جميع أعضاء المدرسة
DROP POLICY IF EXISTS "Authenticated users can view active calendar events" ON public.calendar_events;

-- إنشاء سياسة جديدة تسمح لجميع أعضاء المدرسة برؤية الأحداث
CREATE POLICY "School members can view school calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (
  is_active = true 
  AND (
    (school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'teacher'::app_role, 'student'::app_role, 'parent'::app_role]))
    OR school_id IS NULL  -- أحداث عامة
    OR get_user_role() = 'superadmin'::app_role
  )
);

-- التأكد من وجود تشغيل التحديث التلقائي للطوابع الزمنية
CREATE OR REPLACE FUNCTION public.update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء المشغل إذا لم يكن موجوداً
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_updated_at();

-- التأكد من أن الفهارس موجودة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_calendar_events_school_date ON public.calendar_events(school_id, date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_active ON public.calendar_events(date, is_active);

-- إضافة تعليق للجدول
COMMENT ON TABLE public.calendar_events IS 'جدول الأحداث والتقويم المدرسي - يحتوي على جميع الأحداث المرتبطة بالمدارس';
COMMENT ON COLUMN public.calendar_events.school_id IS 'معرف المدرسة - إذا كان NULL فالحدث عام لجميع المدارس';
COMMENT ON COLUMN public.calendar_events.type IS 'نوع الحدث: event, exam, holiday, meeting, important';
COMMENT ON COLUMN public.calendar_events.is_active IS 'حالة الحدث - النشط فقط يظهر للمستخدمين';