-- إضافة RLS policies لجدول pair_matching_pairs لعرض محتوى الألعاب

-- إضافة سياسة للسماح للطلاب بقراءة أزواج الألعاب النشطة
DROP POLICY IF EXISTS "Students can view matching pairs for active games" ON public.pair_matching_pairs;

CREATE POLICY "Students can view matching pairs for active games" 
ON public.pair_matching_pairs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pair_matching_games pmg 
    WHERE pmg.id = pair_matching_pairs.game_id 
    AND pmg.is_active = true
  )
);

-- التأكد من تفعيل RLS
ALTER TABLE public.pair_matching_pairs ENABLE ROW LEVEL SECURITY;