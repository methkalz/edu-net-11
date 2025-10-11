-- حل مؤقت: السماح للنظام بتوليد الأسئلة تلقائياً
-- إضافة سياسة لإنشاء أسئلة الاختبار عند بدء المحاولة
CREATE POLICY "System can generate exam questions on exam start"
ON public.exam_questions
FOR INSERT
TO authenticated
WITH CHECK (
  -- السماح فقط للاختبارات النشطة المنشورة
  EXISTS (
    SELECT 1 
    FROM public.teacher_exams te
    WHERE te.id = exam_questions.exam_id
      AND te.status = 'published'
      AND te.is_active = true
  )
);