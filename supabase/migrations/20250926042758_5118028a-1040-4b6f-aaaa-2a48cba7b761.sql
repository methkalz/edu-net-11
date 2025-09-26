-- تفعيل Supabase Realtime للجدول student_presence

-- 1. تفعيل REPLICA IDENTITY FULL لضمان إرسال البيانات الكاملة في realtime updates
ALTER TABLE public.student_presence REPLICA IDENTITY FULL;

-- 2. إضافة الجدول إلى supabase_realtime publication لتفعيل realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_presence;