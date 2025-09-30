-- إضافة عمود لتحديد الصفوف المستهدفة في الأحداث
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS target_grade_levels text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_class_ids uuid[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_by_role app_role DEFAULT NULL;

-- تحديث الأحداث الموجودة لتكون مرئية للجميع (NULL = للجميع)
UPDATE public.calendar_events 
SET target_grade_levels = NULL, target_class_ids = NULL
WHERE target_grade_levels IS NULL AND target_class_ids IS NULL;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_calendar_events_target_grades 
ON public.calendar_events USING GIN (target_grade_levels);

CREATE INDEX IF NOT EXISTS idx_calendar_events_target_classes 
ON public.calendar_events USING GIN (target_class_ids);

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "School admins can manage their school events" ON public.calendar_events;
DROP POLICY IF EXISTS "School members can view school calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Superadmins can manage all calendar events" ON public.calendar_events;

-- سياسة جديدة: المعلمون يمكنهم إضافة أحداث لصفوفهم
CREATE POLICY "Teachers can create events for their classes"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'teacher'::app_role AND school_id = get_user_school_id())
  OR (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id())
  OR (get_user_role() = 'superadmin'::app_role)
);

-- سياسة: المعلمون يمكنهم تعديل أحداثهم فقط
CREATE POLICY "Teachers can update their own events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'teacher'::app_role AND created_by = auth.uid() AND school_id = get_user_school_id())
  OR (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id())
  OR (get_user_role() = 'superadmin'::app_role)
);

-- سياسة: المعلمون يمكنهم حذف أحداثهم فقط
CREATE POLICY "Teachers can delete their own events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (
  (get_user_role() = 'teacher'::app_role AND created_by = auth.uid() AND school_id = get_user_school_id())
  OR (get_user_role() = 'school_admin'::app_role AND school_id = get_user_school_id())
  OR (get_user_role() = 'superadmin'::app_role)
);

-- سياسة عرض الأحداث: الطلاب يرون أحداث صفوفهم فقط
CREATE POLICY "Students view events for their classes"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    -- المدراء يرون كل أحداث مدرستهم
    (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]))
    OR
    -- المعلمون يرون أحداثهم وأحداث المدرسة العامة
    (
      get_user_role() = 'teacher'::app_role 
      AND school_id = get_user_school_id()
      AND (
        target_grade_levels IS NULL -- أحداث عامة
        OR target_class_ids IS NULL
        OR created_by = auth.uid() -- أحداث المعلم نفسه
      )
    )
    OR
    -- الطلاب يرون الأحداث الخاصة بصفوفهم فقط
    (
      get_user_role() = 'student'::app_role
      AND school_id = get_user_school_id()
      AND (
        -- أحداث عامة (بدون تحديد صفوف)
        (target_grade_levels IS NULL AND target_class_ids IS NULL)
        OR
        -- أحداث للصف الدراسي للطالب
        EXISTS (
          SELECT 1 
          FROM students s
          JOIN class_students cs ON cs.student_id = s.id
          JOIN classes c ON c.id = cs.class_id
          JOIN grade_levels gl ON gl.id = c.grade_level_id
          WHERE s.user_id = auth.uid()
          AND (
            -- تطابق الصف الدراسي
            (
              target_grade_levels IS NOT NULL 
              AND (
                CASE 
                  WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
                  WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'
                  WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
                  ELSE gl.code
                END = ANY(target_grade_levels)
              )
            )
            OR
            -- تطابق الصف المحدد
            (target_class_ids IS NOT NULL AND c.id = ANY(target_class_ids))
          )
        )
      )
    )
    OR
    -- أحداث عامة بدون مدرسة محددة
    school_id IS NULL
  )
);

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.calendar_events.target_grade_levels IS 'الصفوف الدراسية المستهدفة (10, 11, 12). NULL = للجميع';
COMMENT ON COLUMN public.calendar_events.target_class_ids IS 'معرفات الصفوف المستهدفة. NULL = للجميع';
COMMENT ON COLUMN public.calendar_events.created_by_role IS 'دور منشئ الحدث';