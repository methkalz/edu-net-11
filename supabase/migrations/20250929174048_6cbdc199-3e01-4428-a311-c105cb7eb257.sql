-- إضافة أعمدة الإعدادات الشخصية لجدول profiles
-- إضافة عمود theme (الوضع الليلي/النهاري)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- إضافة عمود font_size (حجم الخط)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra-large'));

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN profiles.theme IS 'User preferred theme (light, dark, system)';
COMMENT ON COLUMN profiles.font_size IS 'User preferred font size (small, medium, large, extra-large)';

-- عرض الأعمدة الجديدة للتأكد
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('theme', 'font_size')
ORDER BY column_name;