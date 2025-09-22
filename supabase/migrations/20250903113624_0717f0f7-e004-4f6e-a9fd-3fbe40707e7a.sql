-- إصلاح RLS policies لجدول grade10_projects لدعم إنشاء المشاريع بشكل صحيح

-- حذف السياسة الحالية للطلاب
DROP POLICY IF EXISTS "Students can create projects for themselves" ON public.grade10_projects;

-- إنشاء سياسة جديدة محسنة للطلاب لإنشاء مشاريعهم
CREATE POLICY "Students can create their own projects"
ON public.grade10_projects
FOR INSERT
WITH CHECK (
  auth.uid() = student_id 
  AND (
    -- للطلاب العاديين: يجب أن يكون school_id مطابق لمدرستهم
    (get_user_role() = 'student' AND school_id = get_user_school_id())
    OR
    -- للمعلمين ومديري المدارس: يمكنهم إنشاء مشاريع للطلاب في مدرستهم
    (get_user_role() IN ('teacher', 'school_admin') AND school_id = get_user_school_id())
    OR
    -- للمديرين العامين: يمكنهم إنشاء مشاريع في أي مدرسة
    get_user_role() = 'superadmin'
  )
);

-- إصلاح سياسة المعلمين لتحديث المشاريع
DROP POLICY IF EXISTS "Teachers can update projects in their school" ON public.grade10_projects;

CREATE POLICY "Teachers can update projects in their school"
ON public.grade10_projects
FOR UPDATE
USING (
  (get_user_role() IN ('teacher', 'school_admin') AND school_id = get_user_school_id())
  OR get_user_role() = 'superadmin'
);

-- إضافة سياسة للمعلمين لإنشاء مشاريع للطلاب
CREATE POLICY "Teachers can create projects for students"
ON public.grade10_projects
FOR INSERT
WITH CHECK (
  get_user_role() IN ('teacher', 'school_admin', 'superadmin')
  AND (
    (get_user_role() IN ('teacher', 'school_admin') AND school_id = get_user_school_id())
    OR get_user_role() = 'superadmin'
  )
);