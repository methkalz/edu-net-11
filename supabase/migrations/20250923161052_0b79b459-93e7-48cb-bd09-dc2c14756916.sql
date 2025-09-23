-- إصلاح فتح اللعبة الأولى لجميع الطلاب
UPDATE public.player_game_progress 
SET is_unlocked = true, updated_at = now()
WHERE game_id IN (
    SELECT id FROM public.pair_matching_games 
    WHERE is_active = true 
      AND grade_level = '11' 
      AND level_number = 1 
      AND stage_number = 1
);