-- حذف السياسة القديمة التي تسمح للمعلمين برؤية جميع صفوف المدرسة
DROP POLICY IF EXISTS "Teachers and admins can manage classes" ON classes;

-- إنشاء سياسة جديدة مُصححة تقيد المعلمين بالصفوف المُعينة لهم فقط
CREATE POLICY "Teachers and admins can manage classes" ON classes
FOR ALL
TO authenticated
USING (
  -- السوبر آدمن: وصول كامل لجميع الصفوف
  (get_user_role() = 'superadmin'::app_role)
  OR 
  -- مدير المدرسة: جميع صفوف مدرسته
  ((get_user_role() = 'school_admin'::app_role) AND (school_id = get_user_school_id()))
  OR 
  -- المعلم: فقط الصفوف المُعينة له أو التي أنشأها
  ((get_user_role() = 'teacher'::app_role) AND (
    is_teacher_assigned_to_class(auth.uid(), id) 
    OR created_by = auth.uid()
  ))
)
WITH CHECK (
  -- السوبر آدمن: وصول كامل
  (get_user_role() = 'superadmin'::app_role)
  OR 
  -- مدير المدرسة: يمكنه إدارة صفوف مدرسته
  ((get_user_role() = 'school_admin'::app_role) AND (school_id = get_user_school_id()))
  OR 
  -- المعلم: يمكنه إنشاء/تعديل صفوف في مدرسته فقط
  ((get_user_role() = 'teacher'::app_role) AND (school_id = get_user_school_id()))
);