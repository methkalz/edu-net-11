-- إضافة Foreign Key constraints لحل مشكلة schema cache

-- أولاً: التحقق من وجود البيانات المطابقة قبل إضافة الـ constraints
-- حذف أي records في school_packages لا تملك package_id أو school_id صحيح
DELETE FROM public.school_packages 
WHERE package_id IS NULL 
   OR school_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM public.packages WHERE id = school_packages.package_id)
   OR NOT EXISTS (SELECT 1 FROM public.schools WHERE id = school_packages.school_id);

-- إضافة foreign key constraint بين school_packages.package_id و packages.id
ALTER TABLE public.school_packages 
ADD CONSTRAINT fk_school_packages_package_id 
FOREIGN KEY (package_id) 
REFERENCES public.packages(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- إضافة foreign key constraint بين school_packages.school_id و schools.id  
ALTER TABLE public.school_packages 
ADD CONSTRAINT fk_school_packages_school_id 
FOREIGN KEY (school_id) 
REFERENCES public.schools(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- إضافة unique constraint لمنع duplicate subscriptions للمدرسة الواحدة
ALTER TABLE public.school_packages 
ADD CONSTRAINT uk_school_packages_school_package 
UNIQUE (school_id, package_id);

-- تحديث الـ RLS policies للتأكد من العمل الصحيح مع الـ foreign keys
DROP POLICY IF EXISTS "School admins can manage their school packages" ON public.school_packages;
DROP POLICY IF EXISTS "Users can view their school packages" ON public.school_packages;

-- إعادة إنشاء RLS policies مع تحسينات
CREATE POLICY "School admins can manage their school packages" 
ON public.school_packages 
FOR ALL 
USING (
  (get_user_role() = 'superadmin'::app_role) OR 
  (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id())
)
WITH CHECK (
  (get_user_role() = 'superadmin'::app_role) OR 
  (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id())
);

CREATE POLICY "Users can view their school packages" 
ON public.school_packages 
FOR SELECT 
USING (
  (get_user_role() = 'superadmin'::app_role) OR 
  (school_id = get_user_school_id())
);