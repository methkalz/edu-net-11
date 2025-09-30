-- إضافة صلاحيات RLS للمعلمين لرؤية تقدم الصف العاشر في الألعاب

-- السماح للمعلمين برؤية ملفات اللاعبين في مدرستهم
CREATE POLICY "Teachers can view student player profiles in their school"
ON public.grade10_player_profiles
FOR SELECT
TO public
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role])) 
  AND EXISTS (
    SELECT 1 
    FROM public.students s
    WHERE s.user_id = grade10_player_profiles.user_id 
      AND s.school_id = get_user_school_id()
  )
);

-- السماح للمعلمين برؤية تقدم الألعاب للطلاب في مدرستهم
CREATE POLICY "Teachers can view student game progress in their school"
ON public.grade10_game_progress
FOR SELECT
TO public
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role])) 
  AND EXISTS (
    SELECT 1 
    FROM public.grade10_player_profiles pp
    JOIN public.students s ON s.user_id = pp.user_id
    WHERE pp.id = grade10_game_progress.player_id 
      AND s.school_id = get_user_school_id()
  )
);