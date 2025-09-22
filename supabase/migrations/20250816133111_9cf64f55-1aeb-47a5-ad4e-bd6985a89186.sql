-- إضافة حقل is_primary_admin إلى جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN is_primary_admin boolean DEFAULT false;

-- تعيين المدراء الحاليين كمدراء أساسيين (واحد لكل مدرسة)
WITH school_primary_admins AS (
  SELECT DISTINCT ON (school_id) 
    user_id,
    school_id
  FROM public.profiles 
  WHERE role = 'school_admin' 
    AND school_id IS NOT NULL
  ORDER BY school_id, created_at ASC
)
UPDATE public.profiles 
SET is_primary_admin = true
WHERE user_id IN (SELECT user_id FROM school_primary_admins);

-- التأكد من النتيجة
SELECT 
  p.full_name,
  p.role,
  p.is_primary_admin,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.role = 'school_admin'
ORDER BY s.name, p.is_primary_admin DESC;