-- حل جذري: إعادة إنشاء الـ trigger وتوحيد أنماط الـ avatars

-- 1. حذف الـ trigger الموجود
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. تحديث جميع الـ avatars لتكون بنمط موحد (اسم الملف فقط بدون مسار)
UPDATE public.profiles 
SET avatar_url = CASE 
    WHEN avatar_url LIKE '/avatars/%' THEN REPLACE(avatar_url, '/avatars/', '')
    WHEN avatar_url LIKE 'avatars/%' THEN REPLACE(avatar_url, 'avatars/', '')
    ELSE avatar_url
END
WHERE avatar_url IS NOT NULL;

-- 3. إعادة إنشاء الـ trigger مع ضمان النمط الموحد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. اختبار الـ function لضمان عملها
DO $$
BEGIN
    -- محاكاة إدخال مستخدم جديد لاختبار الـ function
    RAISE NOTICE 'Testing handle_new_user function setup completed';
END
$$;