-- Fix remaining pair matching policies one by one to avoid deadlock
-- First fix pair_matching_sessions
CREATE POLICY IF NOT EXISTS "Users can create sessions"
ON public.pair_matching_sessions
FOR INSERT 
WITH CHECK (player_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view own sessions"
ON public.pair_matching_sessions
FOR SELECT 
USING (player_id = auth.uid());