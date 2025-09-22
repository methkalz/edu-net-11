-- إضافة حقل stage_number ومجال level_number للألعاب
ALTER TABLE pair_matching_games 
ADD COLUMN IF NOT EXISTS stage_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_number INTEGER DEFAULT 1;

-- تحديث الألعاب الحالية لتعكس المستوى والمرحلة
UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 1,
  title = 'المستوى الأول - المرحلة 1'
WHERE title LIKE '%المستوى الأول%';

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 1,
  title = 'المستوى الثاني - المرحلة 1'
WHERE title LIKE '%المستوى الثاني%';

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 1,
  title = 'المستوى الثالث - المرحلة 1'
WHERE title LIKE '%المستوى الثالث%';

UPDATE pair_matching_games SET 
  level_number = 4, 
  stage_number = 1,
  title = 'المستوى الرابع - المرحلة 1'
WHERE title LIKE '%المستوى الرابع%';

-- إنشاء مراحل إضافية للمستوى الأول (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الأول - المرحلة 2', 'مراجعة أساسيات الشبكات - المرحلة الثانية', 'easy', 4, true, 1, 2),
('المستوى الأول - المرحلة 3', 'مراجعة أساسيات الشبكات - المرحلة الثالثة', 'easy', 4, true, 1, 3),
('المستوى الأول - المرحلة 4', 'مراجعة أساسيات الشبكات - المرحلة الأخيرة', 'easy', 4, true, 1, 4);

-- إنشاء مراحل إضافية للمستوى الثاني (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الثاني - المرحلة 2', 'بروتوكولات الشبكة - المرحلة الثانية', 'medium', 5, true, 2, 2),
('المستوى الثاني - المرحلة 3', 'بروتوكولات الشبكة - المرحلة الثالثة', 'medium', 5, true, 2, 3),
('المستوى الثاني - المرحلة 4', 'بروتوكولات الشبكة - المرحلة الأخيرة', 'medium', 5, true, 2, 4);

-- إنشاء مراحل إضافية للمستوى الثالث (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الثالث - المرحلة 2', 'أمان الشبكات - المرحلة الثانية', 'hard', 6, true, 3, 2),
('المستوى الثالث - المرحلة 3', 'أمان الشبكات - المرحلة الثالثة', 'hard', 6, true, 3, 3),
('المستوى الثالث - المرحلة 4', 'أمان الشبكات - المرحلة الأخيرة', 'hard', 6, true, 3, 4);

-- إنشاء مراحل إضافية للمستوى الرابع (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الرابع - المرحلة 2', 'إدارة الشبكات المتقدمة - المرحلة الثانية', 'expert', 6, true, 4, 2),
('المستوى الرابع - المرحلة 3', 'إدارة الشبكات المتقدمة - المرحلة الثالثة', 'expert', 6, true, 4, 3),
('المستوى الرابع - المرحلة 4', 'إدارة الشبكات المتقدمة - المرحلة الأخيرة', 'expert', 6, true, 4, 4);

-- إضافة مصطلحات إضافية للمراحل الجديدة
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'TCP', 'بروتوكول نقل موثوق يضمن وصول البيانات'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'UDP', 'بروتوكول نقل سريع بدون ضمان الوصول'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'DNS', 'نظام تحويل أسماء النطاقات إلى عناوين IP'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'DHCP', 'بروتوكول التكوين التلقائي للشبكة'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 2';

-- مصطلحات للمرحلة 3 من المستوى الأول
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'FTP', 'بروتوكول نقل الملفات'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'HTTP', 'بروتوكول نقل النصوص التشعبية'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'HTTPS', 'بروتوكول HTTP المشفر والآمن'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'SSH', 'بروتوكول الوصول الآمن للخوادم'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 3';

-- مصطلحات للمرحلة 4 من المستوى الأول
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'SMTP', 'بروتوكول إرسال البريد الإلكتروني'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'POP3', 'بروتوكول استقبال البريد الإلكتروني'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'IMAP', 'بروتوكول وصول الرسائل عبر الإنترنت'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

INSERT INTO pair_matching_pairs (game_id, left_content, right_content, pair_type) 
SELECT g.id, 'SNMP', 'بروتوكول إدارة الشبكة البسيط'
FROM pair_matching_games g WHERE g.title = 'المستوى الأول - المرحلة 4';

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