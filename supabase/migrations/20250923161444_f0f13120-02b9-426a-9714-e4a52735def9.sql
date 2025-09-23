-- إصلاح RLS policies لجدول pair_matching_games لعرض الألعاب للطلاب

-- إضافة سياسة للسماح للطلاب بقراءة الألعاب النشطة
DROP POLICY IF EXISTS "Students can view active matching games" ON public.pair_matching_games;

CREATE POLICY "Students can view active matching games" 
ON public.pair_matching_games 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- التأكد من تفعيل RLS
ALTER TABLE public.pair_matching_games ENABLE ROW LEVEL SECURITY;