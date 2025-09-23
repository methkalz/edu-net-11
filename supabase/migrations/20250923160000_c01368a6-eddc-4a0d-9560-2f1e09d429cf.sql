-- Fix RLS policies for pair matching related tables
DROP POLICY IF EXISTS "Students can log their own activity" ON public.student_activity_log;
CREATE POLICY "Students can log their own activity"
ON public.student_activity_log
FOR INSERT 
WITH CHECK (student_id = auth.uid());

-- Fix pair matching sessions policies
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.pair_matching_sessions;
CREATE POLICY "Users can create their own sessions"
ON public.pair_matching_sessions
FOR INSERT 
WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.pair_matching_sessions;
CREATE POLICY "Users can view their own sessions"
ON public.pair_matching_sessions
FOR SELECT 
USING (player_id = auth.uid());

-- Fix pair matching results policies
DROP POLICY IF EXISTS "Users can create their own results" ON public.pair_matching_results;
CREATE POLICY "Users can create their own results"
ON public.pair_matching_results
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM pair_matching_sessions 
  WHERE id = pair_matching_results.session_id 
  AND player_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can view their own results" ON public.pair_matching_results;
CREATE POLICY "Users can view their own results"
ON public.pair_matching_results
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM pair_matching_sessions 
  WHERE id = pair_matching_results.session_id 
  AND player_id = auth.uid()
));

-- Fix player progress policies
DROP POLICY IF EXISTS "Users can view their own progress" ON public.player_game_progress;
CREATE POLICY "Users can view their own progress"
ON public.player_game_progress
FOR SELECT 
USING (player_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own progress" ON public.player_game_progress;
CREATE POLICY "Users can update their own progress"
ON public.player_game_progress
FOR INSERT 
WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS "Users can upsert their own progress" ON public.player_game_progress;
CREATE POLICY "Users can upsert their own progress"
ON public.player_game_progress
FOR UPDATE 
USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());