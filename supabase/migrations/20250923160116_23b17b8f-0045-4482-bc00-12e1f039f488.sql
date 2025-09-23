-- Check if tables exist and fix policies without IF NOT EXISTS
DO $$
BEGIN
    -- Fix pair_matching_sessions policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pair_matching_sessions') THEN
        DROP POLICY IF EXISTS "Users can create sessions" ON public.pair_matching_sessions;
        CREATE POLICY "Users can create sessions"
        ON public.pair_matching_sessions
        FOR INSERT 
        WITH CHECK (player_id = auth.uid());

        DROP POLICY IF EXISTS "Users can view own sessions" ON public.pair_matching_sessions;
        CREATE POLICY "Users can view own sessions"
        ON public.pair_matching_sessions
        FOR SELECT 
        USING (player_id = auth.uid());
    END IF;

    -- Fix pair_matching_results policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pair_matching_results') THEN
        DROP POLICY IF EXISTS "Users can create results" ON public.pair_matching_results;
        CREATE POLICY "Users can create results"
        ON public.pair_matching_results
        FOR INSERT 
        WITH CHECK (EXISTS (
          SELECT 1 FROM pair_matching_sessions 
          WHERE id = pair_matching_results.session_id 
          AND player_id = auth.uid()
        ));

        DROP POLICY IF EXISTS "Users can view own results" ON public.pair_matching_results;
        CREATE POLICY "Users can view own results"
        ON public.pair_matching_results
        FOR SELECT 
        USING (EXISTS (
          SELECT 1 FROM pair_matching_sessions 
          WHERE id = pair_matching_results.session_id 
          AND player_id = auth.uid()
        ));
    END IF;

    -- Fix player_game_progress policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_game_progress') THEN
        DROP POLICY IF EXISTS "Users can view progress" ON public.player_game_progress;
        CREATE POLICY "Users can view progress"
        ON public.player_game_progress
        FOR SELECT 
        USING (player_id = auth.uid());

        DROP POLICY IF EXISTS "Users can manage progress" ON public.player_game_progress;
        CREATE POLICY "Users can manage progress"
        ON public.player_game_progress
        FOR ALL
        USING (player_id = auth.uid())
        WITH CHECK (player_id = auth.uid());
    END IF;
END $$;