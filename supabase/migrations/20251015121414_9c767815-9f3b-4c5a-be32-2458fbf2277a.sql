-- تحديث جدول grade10_project_tasks لدعم المهام الفرعية
-- إضافة حقول جديدة مطابقة لنظام الصف 12

-- 1. إضافة حقل parent_task_id لدعم المهام الفرعية
ALTER TABLE public.grade10_project_tasks
ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.grade10_project_tasks(id) ON DELETE CASCADE;

-- 2. إضافة حقل task_type لتصنيف المهام
ALTER TABLE public.grade10_project_tasks
ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'main';

-- 3. إضافة حقل due_date لتحديد موعد التسليم للمهام
ALTER TABLE public.grade10_project_tasks
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- 4. إضافة فهرس على parent_task_id لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_grade10_project_tasks_parent_task_id 
ON public.grade10_project_tasks(parent_task_id);

-- 5. إضافة تعليق على الجدول
COMMENT ON TABLE public.grade10_project_tasks IS 'مهام المشاريع المصغرة للصف العاشر - يدعم المهام الفرعية';