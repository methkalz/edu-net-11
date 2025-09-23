-- الحل الجذري والنهائي لمشكلة عدم ظهور ألعاب المطابقة للطلاب

-- 1. إصلاح RLS policies لجدول player_game_progress
DROP POLICY IF EXISTS "Players can view their own progress" ON public.player_game_progress;
DROP POLICY IF EXISTS "Players can update their own progress" ON public.player_game_progress;
DROP POLICY IF EXISTS "System functions can manage progress" ON public.player_game_progress;

CREATE POLICY "Players can manage their own progress" 
ON public.player_game_progress 
FOR ALL 
TO authenticated
USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());

-- 2. إصلاح RLS policies لجدول student_activity_log
DROP POLICY IF EXISTS "Students can log their own activities" ON public.student_activity_log;
DROP POLICY IF EXISTS "Students can view their own activity log" ON public.student_activity_log;

CREATE POLICY "Students can manage their own activity log" 
ON public.student_activity_log 
FOR ALL 
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 3. إصلاح RLS policies لجدول pair_matching_sessions  
DROP POLICY IF EXISTS "Players can manage their own sessions" ON public.pair_matching_sessions;
DROP POLICY IF EXISTS "Players can view their own sessions" ON public.pair_matching_sessions;

CREATE POLICY "Players can manage their own sessions" 
ON public.pair_matching_sessions 
FOR ALL 
TO authenticated
USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());

-- 4. تهيئة التقدم لجميع الطلاب الموجودين بدون تقدم مسجل
INSERT INTO public.player_game_progress (player_id, game_id, is_unlocked, is_completed, best_score, completion_count)
SELECT 
    p.user_id as player_id,
    pmg.id as game_id,
    CASE 
        WHEN pmg.level_number = 1 AND pmg.stage_number = 1 THEN true 
        ELSE false 
    END as is_unlocked,
    false as is_completed,
    0 as best_score,
    0 as completion_count
FROM public.profiles p
CROSS JOIN public.pair_matching_games pmg
WHERE p.role = 'student' 
  AND pmg.is_active = true
  AND pmg.grade_level = '11'
  AND NOT EXISTS (
      SELECT 1 FROM public.player_game_progress pgp
      WHERE pgp.player_id = p.user_id 
        AND pgp.game_id = pmg.id
  )
ON CONFLICT (player_id, game_id) DO NOTHING;

-- 5. التأكد من فتح اللعبة الأولى لجميع الطلاب
UPDATE public.player_game_progress 
SET is_unlocked = true, updated_at = now()
WHERE game_id IN (
    SELECT id FROM public.pair_matching_games 
    WHERE is_active = true 
      AND grade_level = '11' 
      AND level_number = 1 
      AND stage_number = 1
);