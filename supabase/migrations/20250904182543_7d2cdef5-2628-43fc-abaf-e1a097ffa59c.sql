-- إعادة بناء ألعاب المطابقة لتطابق منهج الصف الحادي عشر 100% مع UUID صحيحة

-- 1. حذف جميع الأزواج الموجودة وإعادة بناءها
DELETE FROM pair_matching_pairs;

-- 2. حذف الألعاب الحالية وإنشاء ألعاب جديدة مطابقة للمنهج
DELETE FROM pair_matching_games;

-- 3. إنشاء الألعاب الجديدة حسب التسلسل الصحيح للمنهج
INSERT INTO pair_matching_games (title, description, grade_level, subject, difficulty_level, max_pairs, time_limit_seconds, level_number, stage_number, is_active) VALUES

-- المستوى 1: أساسيات الاتصال (יסודות התקשורת)
('مطابقة مركبات الاتصال الأساسية', 'تعرف على المضيف والشبكات والأجهزة في الاتصال', '11', 'communication', 'easy', 5, 300, 1, 1, true),
('مطابقة الطوبولوجيا الفيزيائية والمنطقية', 'فهم الفرق بين البيئة الفيزيائية والمنطقية للشبكات', '11', 'topology', 'easy', 4, 240, 1, 2, true),
('مطابقة أنواع الشبكات LAN WAN Internet', 'التمييز بين الشبكات المحلية والواسعة والإنترنت', '11', 'network_types', 'easy', 4, 240, 1, 3, true),
('مطابقة طرق الاتصال بالإنترنت', 'تعلم وسائل الاتصال المختلفة للمنازل والمؤسسات', '11', 'internet_connection', 'easy', 4, 240, 1, 4, true),

-- المستوى 2: نظام تشغيل الراوتر/السويتش (מערכת הפעלה)
('مطابقة طرق الدخول للراوتر/السويتش', 'كونسول وTELNET وSSH وطرق الوصول', '11', 'device_access', 'medium', 5, 300, 2, 1, true),
('مطابقة أوضاع العمل في نظام التشغيل', 'User EXEC Mode وPrivileged EXEC Mode والأوامر', '11', 'operating_modes', 'medium', 6, 360, 2, 2, true),
('مطابقة الإعدادات الأولية للأجهزة', 'Hostname وكلمات المرور والBanner والإعدادات', '11', 'device_config', 'medium', 5, 300, 2, 3, true),
('مطابقة إدارة الواجهات والعناوين', 'ضبط IP وSVI والمنافذ الفيزيائية', '11', 'interfaces', 'medium', 6, 360, 2, 4, true),

-- المستوى 3: البروتوكولات والنماذج (פרוטוקולים ומודולים)
('مطابقة قوانين البروتوكولات', 'فهم القوانين والمرسل والمستقبل والقناة المشتركة', '11', 'protocol_rules', 'medium', 4, 240, 3, 1, true),
('مطابقة حزمة بروتوكولات TCP/IP', 'لماذا نحتاج بروتوكولات ومنظمات المعايير', '11', 'tcpip_suite', 'medium', 5, 300, 3, 2, true),
('مطابقة نموذج الطبقات OSI وTCP/IP', 'فهم طبقات الشبكة ولماذا نستخدم النماذج', '11', 'layer_models', 'hard', 6, 360, 3, 3, true),
('مطابقة تغليف البيانات', 'تقسيم البيانات وأسماء الوحدات في كل طبقة', '11', 'data_encapsulation', 'hard', 5, 300, 3, 4, true);

-- تحديث دالة تهيئة التقدم لتفتح اللعبة الأولى الجديدة
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
    RETURN;
  END IF;

  -- فتح أول لعبة في المستوى 1 المرحلة 1 (مركبات الاتصال الأساسية)
  INSERT INTO player_game_progress (player_id, game_id, is_unlocked, is_completed, best_score, completion_count)
  SELECT 
    p_player_id,
    pmg.id,
    true,
    false,
    0,
    0
  FROM pair_matching_games pmg
  WHERE pmg.level_number = 1 
    AND pmg.stage_number = 1
    AND pmg.is_active = true
  ORDER BY pmg.created_at ASC
  LIMIT 1
  ON CONFLICT (player_id, game_id) DO NOTHING;
END;
$function$;