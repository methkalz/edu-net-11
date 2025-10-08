-- أولاً: حذف الصفوف الخاطئة من teacher_classes
DELETE FROM public.teacher_classes
WHERE class_id NOT IN (SELECT id FROM public.classes);

-- ثانياً: إنشاء Foreign Key بين teacher_classes و classes
ALTER TABLE public.teacher_classes
ADD CONSTRAINT teacher_classes_class_id_fkey
FOREIGN KEY (class_id)
REFERENCES public.classes(id)
ON DELETE CASCADE;