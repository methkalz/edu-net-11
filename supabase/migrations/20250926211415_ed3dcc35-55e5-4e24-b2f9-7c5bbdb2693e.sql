-- إضافة سياسة للمستخدمين لرؤية بياناتهم في جدول students
CREATE POLICY "Users can view their own student record" 
ON public.students 
FOR SELECT 
USING (user_id = auth.uid());