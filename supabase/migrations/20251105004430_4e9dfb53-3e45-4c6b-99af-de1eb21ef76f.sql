-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Teachers can view their own comparison results" ON public.pdf_comparison_results;

-- إنشاء سياسة جديدة تسمح للسوبر أدمن برؤية كل شيء
CREATE POLICY "Teachers and admins can view comparison results" 
ON public.pdf_comparison_results 
FOR SELECT 
USING (
  -- المعلم يرى مقارناته
  (requested_by = auth.uid())
  OR
  -- السوبر أدمن يرى كل شيء
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  ))
  OR
  -- مدير المدرسة يرى مقارنات مدرسته
  (
    school_id = (SELECT school_id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'school_admin'
    )
  )
);