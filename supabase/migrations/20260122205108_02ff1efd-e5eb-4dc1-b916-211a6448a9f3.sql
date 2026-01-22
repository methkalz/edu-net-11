-- إصلاح سياسة RLS للسماح بتقديم الامتحان (تغيير status من in_progress إلى submitted)

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Students can update their in_progress attempts" ON public.bagrut_attempts;

-- إنشاء سياسة جديدة مع WITH CHECK صحيح
CREATE POLICY "Students can update their in_progress attempts"
ON public.bagrut_attempts
FOR UPDATE
TO public
USING (
  student_id = auth.uid() 
  AND status = 'in_progress'
)
WITH CHECK (
  student_id = auth.uid() 
  AND status IN ('in_progress', 'submitted')
);