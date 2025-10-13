-- إضافة حقل selected_teacher_categories لتخزين تصنيفات أسئلة المعلم
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS selected_teacher_categories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- جعل حقول التاريخ nullable للسماح بحفظ المسودات بدون تواريخ
ALTER TABLE public.exams 
ALTER COLUMN start_datetime DROP NOT NULL,
ALTER COLUMN end_datetime DROP NOT NULL;

-- تحديث القيم الافتراضية للتواريخ
ALTER TABLE public.exams 
ALTER COLUMN start_datetime SET DEFAULT NULL,
ALTER COLUMN end_datetime SET DEFAULT NULL;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN public.exams.selected_teacher_categories IS 'تصنيفات أسئلة المعلم المختارة للامتحان';
COMMENT ON COLUMN public.exams.start_datetime IS 'تاريخ ووقت بداية الامتحان - nullable للمسودات';
COMMENT ON COLUMN public.exams.end_datetime IS 'تاريخ ووقت نهاية الامتحان - nullable للمسودات';