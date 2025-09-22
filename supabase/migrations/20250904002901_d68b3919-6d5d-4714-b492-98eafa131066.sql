-- إضافة ألعاب سهلة (Easy Level)
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
) VALUES 
(
  gen_random_uuid(),
  'مطابقة أساسيات الحاسوب',
  'تعلم المفاهيم الأساسية لمكونات الحاسوب',
  '11',
  'basics',
  'easy',
  4,
  240,
  true
),
(
  gen_random_uuid(),
  'مطابقة أجهزة الإدخال والإخراج',
  'تعرف على أجهزة الإدخال والإخراج الأساسية',
  '11',
  'hardware',
  'easy',
  4,
  240,
  true
),
(
  gen_random_uuid(),
  'مطابقة أساسيات الشبكات',
  'المفاهيم الأساسية في عالم الشبكات',
  '11',
  'networks',
  'easy',
  4,
  240,
  true
);

-- إضافة أزواج للعبة أساسيات الحاسوب
WITH basics_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة أساسيات الحاسوب'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  basics_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM basics_game,
(VALUES
  ('CPU', 'وحدة المعالجة المركزية', 'text', 'text', 'عقل الحاسوب الذي ينفذ التعليمات', 1),
  ('RAM', 'ذاكرة الوصول العشوائي', 'text', 'text', 'ذاكرة مؤقتة سريعة لتخزين البيانات', 2),
  ('Hard Drive', 'القرص الصلب لتخزين البيانات', 'text', 'text', 'مكان تخزين الملفات بشكل دائم', 3),
  ('Monitor', 'شاشة عرض المعلومات', 'text', 'text', 'جهاز إخراج لعرض النتائج بصرياً', 4)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة أزواج للعبة أجهزة الإدخال والإخراج
WITH io_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة أجهزة الإدخال والإخراج'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  io_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM io_game,
(VALUES
  ('Keyboard', 'لوحة المفاتيح لإدخال النصوص', 'text', 'text', 'جهاز إدخال أساسي للكتابة', 1),
  ('Mouse', 'الفأرة للتحكم في المؤشر', 'text', 'text', 'جهاز إدخال للنقر والتنقل', 2),
  ('Printer', 'طابعة لطباعة المستندات', 'text', 'text', 'جهاز إخراج ينتج نسخ ورقية', 3),
  ('Speaker', 'مكبر صوت لإخراج الصوت', 'text', 'text', 'جهاز إخراج للأصوات والموسيقى', 4)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة أزواج للعبة أساسيات الشبكات
WITH network_basics_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة أساسيات الشبكات'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  network_basics_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM network_basics_game,
(VALUES
  ('Internet', 'الشبكة العالمية للمعلومات', 'text', 'text', 'شبكة تربط أجهزة الحاسوب حول العالم', 1),
  ('WiFi', 'شبكة لاسلكية للاتصال بالإنترنت', 'text', 'text', 'تقنية اتصال بدون أسلاك', 2),
  ('Router', 'جهاز توجيه الشبكة', 'text', 'text', 'يوزع الإنترنت على الأجهزة', 3),
  ('Email', 'البريد الإلكتروني', 'text', 'text', 'خدمة إرسال الرسائل عبر الإنترنت', 4)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);