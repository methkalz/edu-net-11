-- إزالة السياسة القديمة
DROP POLICY IF EXISTS "Students can view school events" ON public.calendar_events;

-- إنشاء سياسة جديدة محسنة للطلاب - تظهر الأحداث العامة فقط للطلاب التابعين للمعلم
CREATE POLICY "Students can view school events" 
ON public.calendar_events
FOR SELECT
USING (
  is_active = true 
  AND school_id = (SELECT school_id FROM public.profiles WHERE user_id = auth.uid())
  AND (
    -- الحدث عام: يظهر فقط للطلاب التابعين للمعلم الذي أنشأ الحدث
    (
      (target_grade_levels IS NULL OR array_length(target_grade_levels, 1) IS NULL)
      AND (target_class_ids IS NULL OR array_length(target_class_ids, 1) IS NULL)
      AND (
        -- تحقق من أن الطالب في فصل يُدرسه المعلم الذي أنشأ الحدث
        EXISTS (
          SELECT 1 
          FROM public.students s
          JOIN public.class_students cs ON cs.student_id = s.id
          JOIN public.teacher_classes tc ON tc.class_id = cs.class_id
          WHERE s.user_id = auth.uid()
          AND tc.teacher_id = calendar_events.created_by
        )
        -- أو إذا كان منشئ الحدث مدير مدرسة/سوبر أدمن
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = calendar_events.created_by
          AND p.role IN ('school_admin', 'superadmin')
        )
      )
    )
    
    OR
    
    -- الحدث مخصص لصف الطالب
    (target_grade_levels IS NOT NULL 
     AND EXISTS (
       SELECT 1 
       FROM public.students s
       JOIN public.class_students cs ON cs.student_id = s.id
       JOIN public.classes c ON c.id = cs.class_id
       JOIN public.grade_levels gl ON gl.id = c.grade_level_id
       WHERE s.user_id = auth.uid()
       AND (
         gl.code = ANY(target_grade_levels)
         OR gl.label = ANY(target_grade_levels)
       )
     ))
    
    OR
    
    -- الحدث مخصص لفصل الطالب
    (target_class_ids IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.students s
       JOIN public.class_students cs ON cs.student_id = s.id
       WHERE s.user_id = auth.uid()
       AND cs.class_id = ANY(target_class_ids)
     ))
  )
);