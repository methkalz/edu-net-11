-- تحديث نظام التقدم في الألعاب لضمان التدرج الصحيح
-- حذف تقدم اللاعبين السابق لإعادة تعيين التقدم
DELETE FROM player_game_progress;

-- تحديث دالة initialize_player_progress لفتح أول لعبة سهلة فقط
CREATE OR REPLACE FUNCTION public.initialize_player_progress(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- فتح أول لعبة سهلة فقط (المستوى الأول)
  INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed)
  SELECT 
    p_player_id,
    pmg.id,
    true,
    false
  FROM pair_matching_games pmg
  WHERE pmg.difficulty_level = 'easy' 
    AND pmg.is_active = true
    AND pmg.title LIKE '%المستوى الأول%'
  LIMIT 1
  ON CONFLICT (player_id, game_id) DO NOTHING;
END;
$function$;

-- تحديث دالة unlock_next_games للتدرج الصحيح حسب المستويات
CREATE OR REPLACE FUNCTION public.unlock_next_games(p_player_id uuid, p_completed_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  completed_game_title TEXT;
  next_game_id UUID;
BEGIN
  -- الحصول على عنوان اللعبة المكتملة
  SELECT title INTO completed_game_title
  FROM pair_matching_games 
  WHERE id = p_completed_game_id;
  
  -- تحديد اللعبة التالية بناءً على المستوى المكتمل
  IF completed_game_title LIKE '%المستوى الأول%' THEN
    -- فتح المستوى الثاني
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE title LIKE '%المستوى الثاني%' 
      AND is_active = true
    LIMIT 1;
      
  ELSIF completed_game_title LIKE '%المستوى الثاني%' THEN
    -- فتح المستوى الثالث
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE title LIKE '%المستوى الثالث%' 
      AND is_active = true
    LIMIT 1;
      
  ELSIF completed_game_title LIKE '%المستوى الثالث%' THEN
    -- فتح المستوى الرابع
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE title LIKE '%المستوى الرابع%' 
      AND is_active = true
    LIMIT 1;
  END IF;
  
  -- فتح اللعبة التالية إذا وُجدت
  IF next_game_id IS NOT NULL THEN
    INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed)
    VALUES (p_player_id, next_game_id, true, false)
    ON CONFLICT (player_id, game_id) 
    DO UPDATE SET 
      is_unlocked = true,
      updated_at = now();
  END IF;
END;
$function$;