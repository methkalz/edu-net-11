-- حذف السياسة القديمة المعقدة
DROP POLICY IF EXISTS "School members can view their school classes" ON classes;

-- إنشاء سياسة بسيطة وواضحة للمعلمين والإداريين
CREATE POLICY "Teachers and admins can view classes"
ON classes
FOR SELECT
TO authenticated
USING (
  -- 1. Superadmin يرى كل شيء
  get_user_role() = 'superadmin'::app_role
  OR
  -- 2. School admin يرى صفوف مدرسته
  (
    get_user_role() = 'school_admin'::app_role 
    AND school_id = get_user_school_id()
  )
  OR
  -- 3. Teacher يرى الصفوف المعينة له في teacher_classes
  (
    get_user_role() = 'teacher'::app_role
    AND EXISTS (
      SELECT 1 FROM teacher_classes tc 
      WHERE tc.class_id = classes.id 
        AND tc.teacher_id = auth.uid()
    )
  )
  OR
  -- 4. Teacher يرى الصفوف التي أنشأها بنفسه
  (
    get_user_role() = 'teacher'::app_role
    AND created_by = auth.uid()
  )
);