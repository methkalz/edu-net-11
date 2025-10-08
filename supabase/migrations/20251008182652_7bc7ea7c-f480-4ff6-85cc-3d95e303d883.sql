-- المرحلة 1: RLS Policies لنظام الاختبارات للمعلم

-- ============================================
-- 1. RLS Policies لجدول question_bank
-- ============================================

-- السماح للمعلمين بإضافة أسئلة خاصة بهم
CREATE POLICY "Teachers can create their own questions"
ON public.question_bank
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
  AND created_by = auth.uid()
  AND school_id = get_user_school_id()
);

-- السماح للمعلمين برؤية أسئلتهم + الأسئلة العامة (بدون school_id)
CREATE POLICY "Teachers can view their own and public questions"
ON public.question_bank
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    -- الأسئلة العامة (من Superadmin)
    school_id IS NULL
    OR
    -- أسئلة المعلم الخاصة
    (created_by = auth.uid() AND school_id = get_user_school_id())
    OR
    -- Superadmin يرى كل شيء
    get_user_role() = 'superadmin'::app_role
  )
);

-- السماح للمعلمين بتعديل أسئلتهم فقط
CREATE POLICY "Teachers can update their own questions"
ON public.question_bank
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  AND school_id = get_user_school_id()
  AND (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  created_by = auth.uid()
  AND school_id = get_user_school_id()
);

-- السماح للمعلمين بحذف أسئلتهم (soft delete)
CREATE POLICY "Teachers can delete their own questions"
ON public.question_bank
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND school_id = get_user_school_id()
  AND (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
);

-- ============================================
-- 2. RLS Policies لجدول exam_templates
-- ============================================

-- السماح للمعلمين بإنشاء قوالب خاصة بهم
CREATE POLICY "Teachers can create their own exam templates"
ON public.exam_templates
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
  AND created_by = auth.uid()
  AND school_id = get_user_school_id()
);

-- السماح للمعلمين برؤية قوالبهم + القوالب العامة
CREATE POLICY "Teachers can view their own and public exam templates"
ON public.exam_templates
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    -- القوالب العامة (من Superadmin)
    school_id IS NULL
    OR
    -- قوالب المعلم الخاصة
    (created_by = auth.uid() AND school_id = get_user_school_id())
    OR
    -- Superadmin يرى كل شيء
    get_user_role() = 'superadmin'::app_role
  )
);

-- السماح للمعلمين بتعديل قوالبهم فقط
CREATE POLICY "Teachers can update their own exam templates"
ON public.exam_templates
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  AND school_id = get_user_school_id()
  AND (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
)
WITH CHECK (
  created_by = auth.uid()
  AND school_id = get_user_school_id()
);

-- السماح للمعلمين بحذف قوالبهم
CREATE POLICY "Teachers can delete their own exam templates"
ON public.exam_templates
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND school_id = get_user_school_id()
  AND (get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
);