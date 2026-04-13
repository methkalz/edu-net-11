
-- =====================================================
-- تنفيذ الفحص الأمني 13.4.2026
-- =====================================================

-- التغيير 1: حذف سياسة USING(true) من bagrut_parsing_jobs
DROP POLICY IF EXISTS "Service role can update all jobs" ON bagrut_parsing_jobs;

-- التغيير 2: حذف سياسة WITH CHECK(true) من teacher_notifications
DROP POLICY IF EXISTS "Allow insert from triggers and functions" ON teacher_notifications;

-- التغيير 3: تقييد Materialized View superadmin_school_stats
REVOKE ALL ON public.superadmin_school_stats FROM PUBLIC;
REVOKE ALL ON public.superadmin_school_stats FROM anon;
REVOKE ALL ON public.superadmin_school_stats FROM authenticated;
GRANT SELECT ON public.superadmin_school_stats TO service_role;

-- التغيير 4: تقييد Materialized View student_current_streaks
REVOKE ALL ON public.student_current_streaks FROM PUBLIC;
REVOKE ALL ON public.student_current_streaks FROM anon;
REVOKE ALL ON public.student_current_streaks FROM authenticated;
GRANT SELECT ON public.student_current_streaks TO service_role;

-- التغيير 5: إنشاء secure_schools_view
CREATE OR REPLACE VIEW public.secure_schools_view
WITH (security_invoker = on)
AS
SELECT
  id,
  name,
  city,
  plan,
  created_at,
  updated_at_utc
FROM public.schools;
