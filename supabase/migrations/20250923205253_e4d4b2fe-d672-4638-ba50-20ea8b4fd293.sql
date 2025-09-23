-- السماح للطلاب برؤية عدد أنشطة زملائهم في نفس المدرسة (بدون البيانات الحساسة)
CREATE POLICY "Students view same school activity counts"
ON student_activity_log
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    student_id = auth.uid() OR
    (
      get_user_role() = 'student' AND
      EXISTS (
        SELECT 1 FROM profiles p1, profiles p2 
        WHERE p1.user_id = auth.uid() 
        AND p2.user_id = student_activity_log.student_id
        AND p1.school_id = p2.school_id
        AND p1.role = 'student' 
        AND p2.role = 'student'
      )
    ) OR
    get_user_role() = ANY(ARRAY['teacher', 'school_admin', 'superadmin']::app_role[])
  )
);

-- السماح للطلاب برؤية عدد إنجازات زملائهم في نفس المدرسة
CREATE POLICY "Students view same school achievement counts" 
ON student_achievements
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    student_id = auth.uid() OR
    (
      get_user_role() = 'student' AND  
      EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = auth.uid()
        AND p2.user_id = student_achievements.student_id  
        AND p1.school_id = p2.school_id
        AND p1.role = 'student'
        AND p2.role = 'student'
      )
    ) OR
    get_user_role() = ANY(ARRAY['teacher', 'school_admin', 'superadmin']::app_role[])
  )
);