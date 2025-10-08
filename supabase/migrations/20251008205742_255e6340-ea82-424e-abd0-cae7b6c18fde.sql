-- إضافة template_id إلى exam_attempts لربط المحاولة بالـ template مباشرة
ALTER TABLE public.exam_attempts 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.exam_templates(id) ON DELETE CASCADE;

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_exam_attempts_template_id ON public.exam_attempts(template_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_template ON public.exam_attempts(student_id, template_id);

-- تحديث RLS policy للسماح للطلاب بإنشاء محاولات
DROP POLICY IF EXISTS "Students can create exam attempts" ON public.exam_attempts;
CREATE POLICY "Students can create exam attempts" 
ON public.exam_attempts 
FOR INSERT 
WITH CHECK (
  student_id = auth.uid() AND
  (
    -- إذا كان الامتحان مرتبط بـ template مباشرة
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.exam_templates et
      WHERE et.id = exam_attempts.template_id 
        AND et.is_active = true
        AND (et.school_id = get_user_school_id() OR et.school_id IS NULL)
    ))
    OR
    -- أو إذا كان مرتبط بـ exam عادي
    (exam_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON e.course_id = c.id
      WHERE e.id = exam_attempts.exam_id 
        AND e.is_active = true
        AND (c.school_id = get_user_school_id() OR get_user_role() = 'superadmin')
    ))
  )
);

-- السماح للطلاب بتحديث محاولاتهم الخاصة (لحفظ الإجابات)
DROP POLICY IF EXISTS "Students can update their attempts" ON public.exam_attempts;
CREATE POLICY "Students can update their attempts" 
ON public.exam_attempts 
FOR UPDATE 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

COMMENT ON COLUMN public.exam_attempts.template_id IS 'معرف قالب الامتحان - يستخدم للامتحانات المنشأة من templates مباشرة';