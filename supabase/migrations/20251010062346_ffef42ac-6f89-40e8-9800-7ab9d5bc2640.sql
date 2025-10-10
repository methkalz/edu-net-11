-- حذف السياسة القديمة وإنشاء سياسة جديدة تدعم teacher_classes
DROP POLICY IF EXISTS "School members can view their school classes" ON classes;

-- إنشاء السياسة الجديدة
CREATE POLICY "School members can view their school classes"
ON classes
FOR SELECT
TO authenticated
USING (
  -- 1. أعضاء نفس المدرسة (school_admin وغيرهم)
  (school_id = get_user_school_id()) 
  OR 
  -- 2. السوبر أدمن
  (get_user_role() = 'superadmin'::app_role)
  OR
  -- 3. المعلم يرى الصفوف المعينة له في teacher_classes
  (
    get_user_role() = 'teacher'::app_role 
    AND EXISTS (
      SELECT 1 
      FROM teacher_classes tc 
      WHERE tc.class_id = classes.id 
        AND tc.teacher_id = auth.uid()
    )
  )
  OR
  -- 4. المعلم يرى الصفوف التي أنشأها بنفسه
  (
    get_user_role() = 'teacher'::app_role 
    AND created_by = auth.uid()
  )
);