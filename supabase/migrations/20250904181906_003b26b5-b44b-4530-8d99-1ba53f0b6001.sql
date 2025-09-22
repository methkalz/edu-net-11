-- تحديث النظام ليفتح اللعبة الأولى الصحيحة حسب الترتيب الجديد

-- 1. حذف جميع بيانات التقدم الموجودة
DELETE FROM player_game_progress;
DELETE FROM pair_matching_sessions;  
DELETE FROM pair_matching_results;

-- 2. تحديث دالة تهيئة التقدم لتفتح اللعبة الأولى الصحيحة
DROP FUNCTION IF EXISTS public.initialize_player_progress(uuid);

CREATE OR REPLACE FUNCTION public.initialize_player_progress(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من وجود تقدم سابق
  IF EXISTS (SELECT 1 FROM player_game_progress WHERE player_id = p_player_id) THEN
    RETURN; -- لا نعيد التهيئة إذا كان هناك تقدم موجود
  END IF;

  -- فتح أول لعبة في المستوى 1 المرحلة 1 (أساسيات الشبكات والاتصال)
  INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed, best_score, completion_count)
  VALUES (
    p_player_id,
    '2e0ab6cf-b2bd-456d-b86b-863363029c4c', -- أساسيات الشبكات والاتصال
    true,
    false,
    0,
    0
  )
  ON CONFLICT (player_id, game_id) DO NOTHING;
END;
$function$;

-- 3. تحديث دالة فتح الألعاب التالية لتتبع الترتيب الجديد
DROP FUNCTION IF EXISTS public.unlock_next_games(uuid, uuid);

CREATE OR REPLACE FUNCTION public.unlock_next_games(p_player_id uuid, p_completed_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  completed_game_level INTEGER;
  completed_game_stage INTEGER;
  next_game_id UUID;
  total_stages_in_level INTEGER;
BEGIN
  -- الحصول على مستوى ومرحلة اللعبة المكتملة
  SELECT level_number, stage_number INTO completed_game_level, completed_game_stage
  FROM pair_matching_games 
  WHERE id = p_completed_game_id AND is_active = true;
  
  -- إذا لم نجد اللعبة، نخرج من الدالة
  IF completed_game_level IS NULL THEN
    RETURN;
  END IF;
  
  -- حساب عدد المراحل الكلي في هذا المستوى
  SELECT COUNT(*) INTO total_stages_in_level
  FROM pair_matching_games
  WHERE level_number = completed_game_level AND is_active = true;
  
  -- إذا لم تكن هذه المرحلة الأخيرة في المستوى، فتح المرحلة التالية
  IF completed_game_stage < total_stages_in_level THEN
    -- فتح المرحلة التالية في نفس المستوى
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE level_number = completed_game_level 
      AND stage_number = completed_game_stage + 1
      AND is_active = true
    ORDER BY stage_number ASC
    LIMIT 1;
  ELSE
    -- إذا كانت هذه المرحلة الأخيرة، فتح المستوى التالي
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE level_number = completed_game_level + 1 
      AND stage_number = 1
      AND is_active = true
    ORDER BY level_number ASC, stage_number ASC
    LIMIT 1;
  END IF;
  
  -- فتح اللعبة التالية إذا وُجدت
  IF next_game_id IS NOT NULL THEN
    INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed, best_score, completion_count)
    VALUES (p_player_id, next_game_id, true, false, 0, 0)
    ON CONFLICT (player_id, game_id) 
    DO UPDATE SET 
      is_unlocked = true,
      updated_at = now();
  END IF;
END;
$function$;

-- 4. التأكد من ترتيب الألعاب النهائي
-- المستوى 1: أساسيات الاتصال والشبكات
UPDATE pair_matching_games SET level_number = 1, stage_number = 1 WHERE id = '2e0ab6cf-b2bd-456d-b86b-863363029c4c';
UPDATE pair_matching_games SET level_number = 1, stage_number = 2 WHERE id = '6ade5280-64fd-4ad6-b078-631b4b5408b9';  
UPDATE pair_matching_games SET level_number = 1, stage_number = 3 WHERE id = 'ea07614d-722f-4624-b7f1-f1eac546033c';

-- المستوى 2: نظام تشغيل الراوتر والسويتش
UPDATE pair_matching_games SET level_number = 2, stage_number = 1 WHERE id = '4c10adc2-2064-45cc-b73b-7d7978bc6611';
UPDATE pair_matching_games SET level_number = 2, stage_number = 2 WHERE id = '7156bd1d-781c-41d5-9afb-d94c6d2f2bfb';
UPDATE pair_matching_games SET level_number = 2, stage_number = 3 WHERE id = 'f5595589-38a2-4d77-bd0d-58d185a065dc';

-- المستوى 3: البروتوكولات والأمان المتقدم  
UPDATE pair_matching_games SET level_number = 3, stage_number = 1 WHERE id = '2f161c05-07ef-4616-b66c-e2bfcf662e28';
UPDATE pair_matching_games SET level_number = 3, stage_number = 2 WHERE id = '9dabf609-1ebc-438b-9866-6851a68dc097';
UPDATE pair_matching_games SET level_number = 3, stage_number = 3 WHERE id = 'ede1351d-709b-4669-b5dd-27b246c759cc';
UPDATE pair_matching_games SET level_number = 3, stage_number = 4 WHERE id = 'e4690183-2fe0-4f6b-95c8-66bfb9696740';