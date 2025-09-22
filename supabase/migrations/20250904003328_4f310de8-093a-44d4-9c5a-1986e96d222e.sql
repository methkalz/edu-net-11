-- إنشاء جدول لتتبع تقدم المستخدم في الألعاب
CREATE TABLE IF NOT EXISTS public.player_game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES pair_matching_games(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  best_score INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  first_completed_at TIMESTAMP WITH TIME ZONE,
  last_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(player_id, game_id)
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_player_game_progress_player_id ON public.player_game_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_progress_game_id ON public.player_game_progress(game_id);

-- تمكين RLS
ALTER TABLE public.player_game_progress ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view their own progress" 
  ON public.player_game_progress 
  FOR SELECT 
  USING (player_id = auth.uid());

CREATE POLICY "Users can update their own progress" 
  ON public.player_game_progress 
  FOR UPDATE 
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own progress" 
  ON public.player_game_progress 
  FOR INSERT 
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Superadmins can manage all progress" 
  ON public.player_game_progress 
  FOR ALL 
  USING (get_user_role() = 'superadmin'::app_role);

-- إنشاء دالة لفتح الألعاب تلقائياً
CREATE OR REPLACE FUNCTION public.unlock_next_games(
  p_player_id UUID,
  p_completed_game_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  completed_difficulty TEXT;
  next_difficulty TEXT;
  easy_completed_all BOOLEAN := false;
  medium_completed_all BOOLEAN := false;
BEGIN
  -- الحصول على صعوبة اللعبة المكتملة
  SELECT difficulty_level INTO completed_difficulty
  FROM pair_matching_games 
  WHERE id = p_completed_game_id;
  
  -- تحديد المستوى التالي
  IF completed_difficulty = 'easy' THEN
    next_difficulty := 'medium';
    
    -- التحقق من إكمال جميع الألعاب السهلة
    SELECT COUNT(*) = (
      SELECT COUNT(*) 
      FROM pair_matching_games 
      WHERE difficulty_level = 'easy' AND is_active = true
    )
    INTO easy_completed_all
    FROM player_game_progress pgp
    JOIN pair_matching_games pmg ON pgp.game_id = pmg.id
    WHERE pgp.player_id = p_player_id 
      AND pmg.difficulty_level = 'easy' 
      AND pgp.is_completed = true
      AND pmg.is_active = true;
      
  ELSIF completed_difficulty = 'medium' THEN
    next_difficulty := 'hard';
    
    -- التحقق من إكمال جميع الألعاب المتوسطة
    SELECT COUNT(*) = (
      SELECT COUNT(*) 
      FROM pair_matching_games 
      WHERE difficulty_level = 'medium' AND is_active = true
    )
    INTO medium_completed_all
    FROM player_game_progress pgp
    JOIN pair_matching_games pmg ON pgp.game_id = pmg.id
    WHERE pgp.player_id = p_player_id 
      AND pmg.difficulty_level = 'medium' 
      AND pgp.is_completed = true
      AND pmg.is_active = true;
  END IF;
  
  -- فتح الألعاب التالية إذا كان المستوى مكتمل
  IF (completed_difficulty = 'easy' AND easy_completed_all) OR 
     (completed_difficulty = 'medium' AND medium_completed_all) THEN
    
    -- فتح جميع ألعاب المستوى التالي
    INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed)
    SELECT 
      p_player_id,
      pmg.id,
      true,
      false
    FROM pair_matching_games pmg
    WHERE pmg.difficulty_level = next_difficulty 
      AND pmg.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM player_game_progress pgp2 
        WHERE pgp2.player_id = p_player_id AND pgp2.game_id = pmg.id
      )
    ON CONFLICT (player_id, game_id) 
    DO UPDATE SET 
      is_unlocked = true,
      updated_at = now();
  ELSE
    -- فتح اللعبة التالية في نفس المستوى
    WITH next_game AS (
      SELECT id FROM pair_matching_games
      WHERE difficulty_level = completed_difficulty 
        AND is_active = true
        AND id NOT IN (
          SELECT game_id FROM player_game_progress
          WHERE player_id = p_player_id AND is_unlocked = true
        )
      ORDER BY created_at ASC
      LIMIT 1
    )
    INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed)
    SELECT p_player_id, id, true, false
    FROM next_game
    ON CONFLICT (player_id, game_id) 
    DO UPDATE SET 
      is_unlocked = true,
      updated_at = now();
  END IF;
END;
$$;

-- إنشاء دالة لإعداد التقدم الأولي للمستخدم الجديد
CREATE OR REPLACE FUNCTION public.initialize_player_progress(p_player_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- فتح أول لعبة سهلة فقط
  INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed)
  SELECT 
    p_player_id,
    pmg.id,
    true,
    false
  FROM pair_matching_games pmg
  WHERE pmg.difficulty_level = 'easy' 
    AND pmg.is_active = true
  ORDER BY pmg.created_at ASC
  LIMIT 1
  ON CONFLICT (player_id, game_id) DO NOTHING;
END;
$$;