-- إنشاء جدول النقاط الموحد
CREATE TABLE IF NOT EXISTS public.student_unified_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  points_value integer NOT NULL DEFAULT 0,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  content_type text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إضافة قيد الفرادة بشكل منفصل
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_unified_points_unique_award'
    ) THEN
        ALTER TABLE public.student_unified_points 
        ADD CONSTRAINT student_unified_points_unique_award 
        UNIQUE(student_id, source_type, source_id);
    END IF;
END $$;

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_student_unified_points_student_id ON public.student_unified_points(student_id);
CREATE INDEX IF NOT EXISTS idx_student_unified_points_source ON public.student_unified_points(source_type, source_id);

-- تمكين RLS
ALTER TABLE public.student_unified_points ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
DO $$
BEGIN
    -- حذف السياسات القديمة إن وجدت
    DROP POLICY IF EXISTS "Students can view their own points" ON public.student_unified_points;
    DROP POLICY IF EXISTS "System can manage student points" ON public.student_unified_points;
    
    -- إنشاء السياسات الجديدة
    CREATE POLICY "Students can view their own points" ON public.student_unified_points
      FOR SELECT USING (student_id = auth.uid());

    CREATE POLICY "System can manage student points" ON public.student_unified_points
      FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN
        -- تجاهل إذا كانت السياسة موجودة
        NULL;
END $$;

-- ترحيل البيانات من student_progress
INSERT INTO public.student_unified_points (
  student_id, 
  points_value, 
  source_type, 
  source_id, 
  content_type, 
  description
)
SELECT DISTINCT
  sp.student_id,
  CASE 
    WHEN sp.content_type = 'lesson' THEN 10
    WHEN sp.content_type = 'video' THEN 15
    WHEN sp.content_type = 'project' THEN 20
    ELSE 5
  END as points_value,
  'content_completion'::text as source_type,
  sp.content_id as source_id,
  sp.content_type,
  CONCAT('ترحيل نقاط ', 
    CASE 
      WHEN sp.content_type = 'lesson' THEN 'درس'
      WHEN sp.content_type = 'video' THEN 'فيديو'  
      WHEN sp.content_type = 'project' THEN 'مشروع'
      ELSE 'محتوى'
    END
  ) as description
FROM public.student_progress sp
WHERE sp.progress_percentage >= 90
  AND NOT EXISTS (
    SELECT 1 FROM public.student_unified_points sup 
    WHERE sup.student_id = sp.student_id 
      AND sup.source_type = 'content_completion' 
      AND sup.source_id = sp.content_id
  );

-- إضافة نقاط تسجيل دخول لكل طالب
INSERT INTO public.student_unified_points (
  student_id,
  points_value,
  source_type,
  source_id,
  content_type,
  description
)
SELECT DISTINCT
  p.user_id as student_id,
  5 as points_value,
  'daily_login'::text as source_type,
  p.user_id as source_id, -- استخدام user_id كـ source_id لنقاط الدخول اليومي
  'login'::text as content_type,
  'نقاط تسجيل دخول يومي' as description
FROM public.profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM public.student_unified_points sup 
    WHERE sup.student_id = p.user_id 
      AND sup.source_type = 'daily_login'
  );