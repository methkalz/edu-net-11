-- المرحلة 1: إنشاء Security Definer Function آمنة
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_class(
  p_teacher_id uuid,
  p_class_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_classes
    WHERE teacher_id = p_teacher_id
      AND class_id = p_class_id
  );
$$;

-- المرحلة 2: حذف جميع السياسات القديمة على classes
DROP POLICY IF EXISTS "Teachers and admins can view classes" ON classes;
DROP POLICY IF EXISTS "Teachers and admins can manage their school classes" ON classes;
DROP POLICY IF EXISTS "School members can view their school classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view assigned and created classes" ON classes;
DROP POLICY IF EXISTS "Teachers and admins can manage classes" ON classes;

-- المرحلة 3: إنشاء سياسة SELECT نظيفة بدون تداخل دائري
CREATE POLICY "Teachers can view assigned and created classes"
ON classes
FOR SELECT
TO authenticated
USING (
  -- 1. Superadmin يرى كل شيء
  get_user_role() = 'superadmin'::app_role
  OR
  -- 2. School admin في نفس المدرسة
  (
    get_user_role() = 'school_admin'::app_role 
    AND school_id = get_user_school_id()
  )
  OR
  -- 3. Teacher يرى الصفوف المعينة له (باستخدام الدالة الآمنة)
  (
    get_user_role() = 'teacher'::app_role
    AND is_teacher_assigned_to_class(auth.uid(), id)
  )
  OR
  -- 4. Teacher يرى الصفوف التي أنشأها
  (
    get_user_role() = 'teacher'::app_role
    AND created_by = auth.uid()
  )
);

-- المرحلة 4: إنشاء سياسة INSERT/UPDATE/DELETE
CREATE POLICY "Teachers and admins can manage classes"
ON classes
FOR ALL
TO authenticated
USING (
  get_user_role() = 'superadmin'::app_role
  OR
  (
    get_user_role() = 'school_admin'::app_role 
    AND school_id = get_user_school_id()
  )
  OR
  (
    get_user_role() = 'teacher'::app_role
    AND school_id = get_user_school_id()
  )
)
WITH CHECK (
  get_user_role() = 'superadmin'::app_role
  OR
  (
    get_user_role() = 'school_admin'::app_role 
    AND school_id = get_user_school_id()
  )
  OR
  (
    get_user_role() = 'teacher'::app_role
    AND school_id = get_user_school_id()
  )
);

-- المرحلة 5: تبسيط سياسات teacher_classes لتجنب أي تداخل مستقبلي
DROP POLICY IF EXISTS "School members can view class enrollments" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers and admins can manage class enrollments" ON teacher_classes;
DROP POLICY IF EXISTS "View teacher class assignments" ON teacher_classes;
DROP POLICY IF EXISTS "Manage teacher class assignments" ON teacher_classes;

CREATE POLICY "View teacher class assignments"
ON teacher_classes
FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])
);

CREATE POLICY "Manage teacher class assignments"
ON teacher_classes
FOR ALL
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])
);