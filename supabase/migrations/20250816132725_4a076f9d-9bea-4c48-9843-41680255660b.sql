-- التأكد من عدم تأثر السوبر آدمن بالتغييرات
-- أولاً: نتحقق من السوبر آدمن الحالي
SELECT user_id, full_name, role, email 
FROM public.profiles 
WHERE role = 'superadmin';

-- ثانياً: نحدث فقط المدراء الذين ليسوا سوبر آدمن
UPDATE public.profiles 
SET role = 'school_admin'::app_role,
    school_id = (
      SELECT s.id 
      FROM public.schools s 
      WHERE s.name LIKE '%' || SUBSTRING(profiles.full_name FROM 5) || '%'
      LIMIT 1
    )
WHERE full_name LIKE 'مدير%' 
  AND role != 'superadmin'  -- تأكيد عدم تأثر السوبر آدمن
  AND role != 'school_admin'; -- تجنب التحديث المكرر

-- ثالثاً: التحقق من النتيجة النهائية
SELECT 
  p.full_name,
  p.role,
  s.name as school_name,
  p.email
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.role IN ('superadmin', 'school_admin')
ORDER BY p.role DESC, p.full_name;