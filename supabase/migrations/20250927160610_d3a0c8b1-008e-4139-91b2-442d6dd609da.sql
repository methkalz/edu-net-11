-- إعادة إنشاء handle_new_user trigger بشكل صحيح

-- أولاً، التأكد من حذف أي trigger موجود
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ثم إعادة إنشاء الـ trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- التحقق من أن الـ trigger تم إنشاؤه بنجاح
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    trigger_schema,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';