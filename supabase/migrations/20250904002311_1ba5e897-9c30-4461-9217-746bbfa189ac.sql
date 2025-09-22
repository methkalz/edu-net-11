-- تحديث اللعبة الحالية لتقليل عدد الأزواج إلى 5
UPDATE pair_matching_games 
SET max_pairs = 5, 
    updated_at = now()
WHERE id = '9dabf609-1ebc-438b-9866-6851a68dc097';

-- حذف آخر زوج من اللعبة الحالية للوصول إلى 5 أزواج
DELETE FROM pair_matching_pairs 
WHERE game_id = '9dabf609-1ebc-438b-9866-6851a68dc097' 
AND order_index = 6;

-- إضافة لعبة جديدة: أمن المعلومات
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم أمن المعلومات',
  'لعبة تفاعلية لمطابقة المفاهيم الأساسية في أمن المعلومات والحماية الرقمية',
  '11',
  'security',
  'medium',
  5,
  300,
  true
);

-- الحصول على معرف اللعبة الجديدة
WITH new_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم أمن المعلومات'
  LIMIT 1
)
-- إضافة أزواج أمن المعلومات
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_game,
(VALUES
  ('Firewall', 'جدار حماية يمنع الوصول غير المصرح به', 'text', 'text', 'يحمي الشبكة من التهديدات الخارجية', 1),
  ('Antivirus', 'برنامج مكافحة الفيروسات والبرمجيات الضارة', 'text', 'text', 'يكشف ويزيل البرمجيات الخبيثة', 2),
  ('Encryption', 'تشفير البيانات لحمايتها من التجسس', 'text', 'text', 'يحول البيانات إلى رموز غير مفهومة', 3),
  ('VPN', 'شبكة خاصة افتراضية للاتصال الآمن', 'text', 'text', 'ينشئ نفقاً آمناً عبر الإنترنت', 4),
  ('Malware', 'برمجيات خبيثة تضر بالحاسوب', 'text', 'text', 'تشمل الفيروسات وأحصنة طروادة', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة لعبة جديدة: قواعد البيانات
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم قواعد البيانات',
  'لعبة تعليمية لمطابقة المفاهيم الأساسية في قواعد البيانات وإدارتها',
  '11',
  'databases',
  'medium',
  5,
  300,
  true
);

-- إضافة أزواج قواعد البيانات
WITH new_db_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم قواعد البيانات'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_db_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_db_game,
(VALUES
  ('Primary Key', 'مفتاح أساسي يحدد كل سجل بشكل فريد', 'text', 'text', 'يضمن عدم تكرار السجلات في الجدول', 1),
  ('Foreign Key', 'مفتاح خارجي يربط بين الجداول', 'text', 'text', 'يحافظ على سلامة البيانات بين الجداول', 2),
  ('SQL', 'لغة استعلام منظمة لإدارة قواعد البيانات', 'text', 'text', 'تستخدم لإنشاء وتعديل واستعلام البيانات', 3),
  ('Normalization', 'تطبيع قاعدة البيانات لتقليل التكرار', 'text', 'text', 'ينظم البيانات ويقلل من الإزدواجية', 4),
  ('Index', 'فهرسة لتسريع البحث في قاعدة البيانات', 'text', 'text', 'يحسن أداء الاستعلامات والبحث', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة لعبة جديدة: أنظمة التشغيل
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم أنظمة التشغيل',
  'لعبة تفاعلية لمطابقة المفاهيم الأساسية في أنظمة التشغيل وإدارة الموارد',
  '11',
  'operating_systems',
  'medium',
  5,
  300,
  true
);

-- إضافة أزواج أنظمة التشغيل
WITH new_os_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم أنظمة التشغيل'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_os_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_os_game,
(VALUES
  ('Process', 'عملية قيد التنفيذ في الذاكرة', 'text', 'text', 'برنامج يعمل حالياً ويستهلك موارد النظام', 1),
  ('Thread', 'خيط تنفيذ داخل العملية الواحدة', 'text', 'text', 'يسمح بتنفيذ مهام متعددة بالتوازي', 2),
  ('Kernel', 'نواة النظام التي تدير الموارد', 'text', 'text', 'الجزء الأساسي الذي يتحكم في الأجهزة', 3),
  ('Virtual Memory', 'ذاكرة افتراضية توسع الذاكرة الفيزيائية', 'text', 'text', 'تستخدم القرص الصلب كامتداد للذاكرة', 4),
  ('File System', 'نظام إدارة الملفات على القرص', 'text', 'text', 'ينظم تخزين واسترجاع البيانات', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة لعبة جديدة: البرمجة الكائنية
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم البرمجة الكائنية',
  'لعبة تعليمية لمطابقة المفاهيم الأساسية في البرمجة الكائنية التوجه',
  '11',
  'programming',
  'hard',
  5,
  300,
  true
);

-- إضافة أزواج البرمجة الكائنية
WITH new_oop_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم البرمجة الكائنية'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_oop_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_oop_game,
(VALUES
  ('Class', 'قالب أو نموذج لإنشاء كائنات', 'text', 'text', 'يحدد الخصائص والوظائف للكائن', 1),
  ('Object', 'مثيل محدد من الفئة (Class)', 'text', 'text', 'نسخة فعلية تحتوي على بيانات حقيقية', 2),
  ('Inheritance', 'وراثة الخصائص من فئة أبوية', 'text', 'text', 'تسمح بإعادة استخدام الكود وتوسيعه', 3),
  ('Polymorphism', 'تعدد الأشكال في تنفيذ الوظائف', 'text', 'text', 'نفس الوظيفة تعمل بطرق مختلفة', 4),
  ('Encapsulation', 'تغليف البيانات وإخفاء التفاصيل الداخلية', 'text', 'text', 'يحمي البيانات من التلاعب المباشر', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة لعبة جديدة: الذكاء الاصطناعي (مستوى متقدم)
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم الذكاء الاصطناعي',
  'لعبة متقدمة لمطابقة المفاهيم الأساسية في الذكاء الاصطناعي والتعلم الآلي',
  '11',
  'artificial_intelligence',
  'hard',
  5,
  360,
  true
);

-- إضافة أزواج الذكاء الاصطناعي
WITH new_ai_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم الذكاء الاصطناعي'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_ai_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_ai_game,
(VALUES
  ('Machine Learning', 'تعلم الآلة من البيانات بدون برمجة صريحة', 'text', 'text', 'يحسن الأداء من خلال الخبرة والتدريب', 1),
  ('Neural Network', 'شبكة عصبية تحاكي عمل الدماغ البشري', 'text', 'text', 'تتكون من عقد مترابطة تعالج المعلومات', 2),
  ('Deep Learning', 'تعلم عميق باستخدام شبكات عصبية متعددة الطبقات', 'text', 'text', 'يتعامل مع البيانات المعقدة كالصور والصوت', 3),
  ('Algorithm', 'خوارزمية محددة لحل مشكلة معينة', 'text', 'text', 'تسلسل منطقي من الخطوات للوصول للحل', 4),
  ('Big Data', 'مجموعات بيانات ضخمة يصعب معالجتها تقليدياً', 'text', 'text', 'تتطلب تقنيات خاصة للتحليل والمعالجة', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);