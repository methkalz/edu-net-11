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