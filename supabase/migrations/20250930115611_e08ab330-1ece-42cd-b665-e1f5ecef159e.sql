-- إضافة سياسة RLS للمعلمين لمشاهدة تقدم الطلاب في الألعاب
CREATE POLICY "Teachers can view student game progress in their school"
ON public.player_game_progress
FOR SELECT
TO public
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role])) 
  AND EXISTS (
    SELECT 1 
    FROM public.students s
    WHERE s.user_id = player_game_progress.player_id 
      AND s.school_id = get_user_school_id()
  )
);