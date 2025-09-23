-- إصلاح صور البروفايل الخاطئة
-- تحديث جميع المستخدمين الذين لديهم avatar_url خاطئ إلى صورة افتراضية صحيحة

UPDATE public.profiles 
SET avatar_url = '/avatars/student-boy-1.png'
WHERE avatar_url = '/avatars/universal-default.png' OR avatar_url IS NULL;

-- إضافة صورة افتراضية جديدة إلى جدول avatar_images إذا لم تكن موجودة
INSERT INTO public.avatar_images (
  id,
  file_path,
  filename,
  display_name,
  category,
  order_index,
  is_active
) 
SELECT 
  gen_random_uuid(),
  '/avatars/universal-default.png',
  'universal-default.png',
  'صورة افتراضية عامة',
  'universal',
  999,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.avatar_images 
  WHERE file_path = '/avatars/universal-default.png'
);