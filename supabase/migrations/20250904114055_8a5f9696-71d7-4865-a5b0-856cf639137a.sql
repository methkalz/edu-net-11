-- إضافة مصطلحات إضافية للمراحل الجديدة (بدون pair_type)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'TCP', 'بروتوكول نقل موثوق يضمن وصول البيانات'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'UDP', 'بروتوكول نقل سريع بدون ضمان الوصول'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'DNS', 'نظام تحويل أسماء النطاقات إلى عناوين IP'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'DHCP', 'بروتوكول التكوين التلقائي للشبكة'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

-- مصطلحات للمرحلة 3 من المستوى الأول
INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'FTP', 'بروتوكول نقل الملفات'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'HTTP', 'بروتوكول نقل النصوص التشعبية'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'HTTPS', 'بروتوكول HTTP المشفر والآمن'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'SSH', 'بروتوكول الوصول الآمن للخوادم'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

-- مصطلحات للمرحلة 4 من المستوى الأول
INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'SMTP', 'بروتوكول إرسال البريد الإلكتروني'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'POP3', 'بروتوكول استقبال البريد الإلكتروني'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'IMAP', 'بروتوكول وصول الرسائل عبر الإنترنت'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'SNMP', 'بروتوكول إدارة الشبكة البسيط'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

-- إضافة مصطلحات للمراحل الإضافية للمستوى الثاني
INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'OSI Model', 'النموذج المرجعي للاتصالات المفتوحة'
FROM pair_matching_games g WHERE g.title = 'المستوى الثاني - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'TCP/IP Model', 'نموذج بروتوكولات TCP/IP'
FROM pair_matching_games g WHERE g.title = 'المستوى الثاني - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'Physical Layer', 'الطبقة الفيزيائية - طبقة نقل البتات'
FROM pair_matching_games g WHERE g.title = 'المستوى الثاني - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'Data Link Layer', 'طبقة ربط البيانات - طبقة التحكم في الأخطاء'
FROM pair_matching_games g WHERE g.title = 'المستوى الثاني - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content) 
SELECT g.id, 'Network Layer', 'طبقة الشبكة - طبقة التوجيه'
FROM pair_matching_games g WHERE g.title = 'المستوى الثاني - المرحلة 2';

-- تحديث دالة فتح المراحل التالية
CREATE OR REPLACE FUNCTION public.unlock_next_games(p_player_id uuid, p_completed_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  WHERE id = p_completed_game_id;
  
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
    LIMIT 1;
  ELSE
    -- إذا كانت هذه المرحلة الأخيرة، فتح المستوى التالي
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE level_number = completed_game_level + 1 
      AND stage_number = 1
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

-- تحديث دالة تهيئة تقدم اللاعب لفتح المرحلة الأولى من المستوى الأول فقط
CREATE OR REPLACE FUNCTION public.initialize_player_progress(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- فتح المرحلة الأولى من المستوى الأول فقط
  INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed)
  SELECT 
    p_player_id,
    pmg.id,
    true,
    false
  FROM pair_matching_games pmg
  WHERE pmg.level_number = 1 
    AND pmg.stage_number = 1
    AND pmg.is_active = true
  LIMIT 1
  ON CONFLICT (player_id, game_id) DO NOTHING;
END;
$function$;