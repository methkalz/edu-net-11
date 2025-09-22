-- إصلاح منطق فتح الألعاب وإضافة أزواج المطابقة

-- 1. تصحيح دالة تهيئة تقدم اللاعب لفتح لعبة واحدة فقط
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

  -- فتح أول لعبة في أول مستوى فقط
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
  ORDER BY pmg.created_at ASC
  LIMIT 1
  ON CONFLICT (player_id, game_id) DO NOTHING;
END;
$function$;

-- 2. إعادة تعريف دالة فتح الألعاب التالية
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
    ORDER BY created_at ASC
    LIMIT 1;
  ELSE
    -- إذا كانت هذه المرحلة الأخيرة، فتح المستوى التالي
    SELECT id INTO next_game_id
    FROM pair_matching_games
    WHERE level_number = completed_game_level + 1 
      AND stage_number = 1
      AND is_active = true
    ORDER BY created_at ASC
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

-- 3. إضافة أزواج المطابقة للألعاب الموجودة
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES

-- أزواج لعبة مطابقة مفاهيم أمن المعلومات
('ede1351d-709b-4669-b5dd-27b246c759cc', 'التشفير', 'عملية تحويل البيانات إلى شكل لا يمكن قراءته بدون المفتاح', 'term', 'definition', 'التشفير هو حجر الأساس في أمن المعلومات', 1),
('ede1351d-709b-4669-b5dd-27b246c759cc', 'جدار الحماية', 'نظام أمني يراقب ويتحكم في حركة البيانات الداخلة والخارجة', 'term', 'definition', 'جدار الحماية يعمل كحاجز بين الشبكة الداخلية والخارجية', 2),
('ede1351d-709b-4669-b5dd-27b246c759cc', 'الفيروسات', 'برامج ضارة تلحق الضرر بالأنظمة والملفات', 'term', 'definition', 'الفيروسات من أشهر التهديدات السيبرانية', 3),
('ede1351d-709b-4669-b5dd-27b246c759cc', 'المصادقة', 'عملية التحقق من هوية المستخدم أو النظام', 'term', 'definition', 'المصادقة ضرورية للتحكم في الوصول للموارد', 4),
('ede1351d-709b-4669-b5dd-27b246c759cc', 'النسخ الاحتياطي', 'عملية إنشاء نسخ من البيانات لحفظها في أماكن آمنة', 'term', 'definition', 'النسخ الاحتياطي حماية ضد فقدان البيانات', 5),

-- أزواج لعبة مطابقة مفاهيم قواعد البيانات
('e4690183-2fe0-4f6b-95c8-66bfb9696740', 'SQL', 'لغة استعلام منظمة للتعامل مع قواعد البيانات العلاقية', 'term', 'definition', 'SQL هي اللغة المعيارية للتعامل مع قواعد البيانات', 1),
('e4690183-2fe0-4f6b-95c8-66bfb9696740', 'المفتاح الأساسي', 'عمود أو مجموعة أعمدة تحدد كل صف بشكل فريد في الجدول', 'term', 'definition', 'المفتاح الأساسي ضروري لضمان فرادة البيانات', 2),
('e4690183-2fe0-4f6b-95c8-66bfb9696740', 'الفهرسة', 'تقنية لتسريع عمليات البحث والاستعلام في قاعدة البيانات', 'term', 'definition', 'الفهرسة تحسن أداء قاعدة البيانات بشكل كبير', 3),
('e4690183-2fe0-4f6b-95c8-66bfb9696740', 'التطبيع', 'عملية تنظيم البيانات في قاعدة البيانات لتقليل التكرار', 'term', 'definition', 'التطبيع يحسن كفاءة تخزين البيانات', 4),
('e4690183-2fe0-4f6b-95c8-66bfb9696740', 'المعاملات', 'مجموعة عمليات قاعدة البيانات التي تنفذ كوحدة واحدة', 'term', 'definition', 'المعاملات تضمن تماسك البيانات', 5),

-- أزواج لعبة مطابقة مفاهيم أنظمة التشغيل
('4c10adc2-2064-45cc-b73b-7d7978bc6611', 'نواة النظام', 'الجزء الأساسي من نظام التشغيل الذي يدير الموارد', 'term', 'definition', 'النواة هي قلب نظام التشغيل', 1),
('4c10adc2-2064-45cc-b73b-7d7978bc6611', 'العمليات', 'برامج قيد التنفيذ في الذاكرة الرئيسية', 'term', 'definition', 'العمليات هي وحدات العمل في نظام التشغيل', 2),
('4c10adc2-2064-45cc-b73b-7d7978bc6611', 'الذاكرة الافتراضية', 'تقنية تسمح بتشغيل برامج أكبر من الذاكرة الفعلية', 'term', 'definition', 'الذاكرة الافتراضية توسع قدرات النظام', 3),
('4c10adc2-2064-45cc-b73b-7d7978bc6611', 'نظام الملفات', 'طريقة تنظيم وتخزين الملفات على أجهزة التخزين', 'term', 'definition', 'نظام الملفات ينظم البيانات على القرص', 4),
('4c10adc2-2064-45cc-b73b-7d7978bc6611', 'جدولة العمليات', 'خوارزميات توزيع وقت المعالج على العمليات المختلفة', 'term', 'definition', 'الجدولة تحسن أداء النظام', 5),

-- أزواج للألعاب الأخرى...
('7156bd1d-781c-41d5-9afb-d94c6d2f2bfb', 'الفئات والكائنات', 'مفاهيم أساسية في البرمجة الكائنية للتنظيم والتجميع', 'term', 'definition', 'الفئات هي قوالب لإنشاء الكائنات', 1),
('7156bd1d-781c-41d5-9afb-d94c6d2f2bfb', 'الوراثة', 'آلية تسمح للفئة بوراثة خصائص وطرق من فئة أخرى', 'term', 'definition', 'الوراثة تعزز إعادة الاستخدام في الكود', 2),
('7156bd1d-781c-41d5-9afb-d94c6d2f2bfb', 'التغليف', 'إخفاء تفاصيل التنفيذ وإظهار واجهة محددة فقط', 'term', 'definition', 'التغليف يحمي البيانات ويحسن الأمان', 3),
('7156bd1d-781c-41d5-9afb-d94c6d2f2bfb', 'تعدد الأشكال', 'قدرة الكائنات المختلفة على الاستجابة لنفس الطريقة', 'term', 'definition', 'تعدد الأشكال يوفر مرونة في التصميم', 4),

('ea07614d-722f-4624-b7f1-f1eac546033c', 'المعالج', 'الوحدة المركزية التي تنفذ التعليمات في الحاسوب', 'term', 'definition', 'المعالج هو عقل الحاسوب', 1),
('ea07614d-722f-4624-b7f1-f1eac546033c', 'الذاكرة الرئيسية', 'مكان تخزين البيانات والبرامج المؤقت أثناء التشغيل', 'term', 'definition', 'الذاكرة الرئيسية سريعة لكنها مؤقتة', 2),
('ea07614d-722f-4624-b7f1-f1eac546033c', 'القرص الصلب', 'وحدة التخزين الدائم للبيانات والبرامج', 'term', 'definition', 'القرص الصلب يحفظ البيانات حتى بعد إغلاق الجهاز', 3),
('ea07614d-722f-4624-b7f1-f1eac546033c', 'اللوحة الأم', 'اللوحة الرئيسية التي تربط جميع مكونات الحاسوب', 'term', 'definition', 'اللوحة الأم تشكل العمود الفقري للحاسوب', 4);

-- تحديث إعدادات الألعاب لتصنيفها في مستويات ومراحل صحيحة
UPDATE pair_matching_games SET level_number = 1, stage_number = 1 WHERE subject = 'security' AND difficulty_level = 'medium';
UPDATE pair_matching_games SET level_number = 1, stage_number = 2 WHERE subject = 'databases' AND difficulty_level = 'medium';  
UPDATE pair_matching_games SET level_number = 1, stage_number = 3 WHERE subject = 'operating_systems' AND difficulty_level = 'medium';
UPDATE pair_matching_games SET level_number = 1, stage_number = 4 WHERE subject = 'programming' AND difficulty_level = 'hard';

UPDATE pair_matching_games SET level_number = 2, stage_number = 1 WHERE subject = 'basics' AND difficulty_level = 'easy';
UPDATE pair_matching_games SET level_number = 2, stage_number = 2 WHERE subject = 'hardware' AND difficulty_level = 'easy';
UPDATE pair_matching_games SET level_number = 2, stage_number = 3 WHERE subject = 'networks' AND difficulty_level = 'easy';

UPDATE pair_matching_games SET level_number = 3, stage_number = 1 WHERE subject = 'networks' AND difficulty_level = 'medium';
UPDATE pair_matching_games SET level_number = 3, stage_number = 2 WHERE subject = 'programming' AND difficulty_level = 'medium';