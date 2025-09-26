-- إصلاح مشكلة ربط المعلمين بالصفوف التي ينشئونها

-- 1. تحديث سياسات RLS لجدول teacher_classes للسماح للمعلمين بإضافة أنفسهم للصفوف
DROP POLICY IF EXISTS "Teachers can manage their class assignments" ON public.teacher_classes;

CREATE POLICY "Teachers can manage their class assignments" ON public.teacher_classes
FOR ALL
USING (
  teacher_id = auth.uid() OR 
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  teacher_id = auth.uid() OR 
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]))
);

-- 2. إصلاح البيانات الموجودة - ربط الصفوف بمنشئيها
INSERT INTO public.teacher_classes (teacher_id, class_id)
SELECT 
  c.created_by as teacher_id,
  c.id as class_id
FROM public.classes c
LEFT JOIN public.teacher_classes tc ON tc.class_id = c.id
WHERE tc.class_id IS NULL  -- الصفوف التي ليس لها معلمين
  AND c.created_by IS NOT NULL  -- التأكد من وجود منشئ
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = c.created_by 
    AND p.role = 'teacher'::app_role
  ) -- التأكد من أن المنشئ معلم
ON CONFLICT (teacher_id, class_id) DO NOTHING;