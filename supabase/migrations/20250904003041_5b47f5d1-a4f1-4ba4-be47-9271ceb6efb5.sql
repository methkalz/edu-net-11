-- إضافة ألعاب صعبة إضافية (Hard Level)
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
  'مطابقة خوارزميات التشفير',
  'تعلم خوارزميات التشفير المتقدمة وتطبيقاتها',
  '11',
  'security',
  'hard',
  7,
  420,
  true
),
(
  gen_random_uuid(),
  'مطابقة هياكل البيانات المتقدمة',
  'فهم هياكل البيانات المعقدة وخصائصها',
  '11',
  'algorithms',
  'hard',
  7,
  420,
  true
),
(
  gen_random_uuid(),
  'مطابقة معمارية الحاسوب',
  'تعلم مكونات معمارية الحاسوب الداخلية',
  '11',
  'architecture',
  'hard',
  6,
  400,
  true
);

-- إضافة أزواج للعبة خوارزميات التشفير
WITH encryption_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة خوارزميات التشفير'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  encryption_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM encryption_game,
(VALUES
  ('AES', 'معيار التشفير المتقدم المتماثل', 'text', 'text', 'خوارزمية تشفير قوية وسريعة', 1),
  ('RSA', 'خوارزمية تشفير غير متماثلة', 'text', 'text', 'تستخدم مفاتيح عامة وخاصة', 2),
  ('SHA-256', 'خوارزمية هاش آمنة 256 بت', 'text', 'text', 'تنتج بصمة رقمية فريدة', 3),
  ('DES', 'معيار تشفير البيانات القديم', 'text', 'text', 'خوارزمية تشفير أصبحت ضعيفة', 4),
  ('MD5', 'خوارزمية هاش سريعة لكن غير آمنة', 'text', 'text', 'لا تستخدم للأمان الحرج', 5),
  ('Blowfish', 'خوارزمية تشفير متماثلة سريعة', 'text', 'text', 'مناسبة للتطبيقات السريعة', 6),
  ('ECC', 'تشفير المنحنيات البيضاوية', 'text', 'text', 'أمان عالي بمفاتيح أصغر', 7)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة أزواج للعبة هياكل البيانات المتقدمة
WITH structures_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة هياكل البيانات المتقدمة'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  structures_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM structures_game,
(VALUES
  ('Binary Tree', 'شجرة ثنائية للبحث والترتيب', 'text', 'text', 'كل عقدة لها طفلان كحد أقصى', 1),
  ('Hash Table', 'جدول هاش للوصول السريع', 'text', 'text', 'يستخدم دالة هاش لتخزين البيانات', 2),
  ('Linked List', 'قائمة مترابطة من العقد', 'text', 'text', 'كل عقدة تشير إلى التالية', 3),
  ('Stack', 'مكدس يعمل بنظام LIFO', 'text', 'text', 'آخر داخل أول خارج', 4),
  ('Queue', 'طابور يعمل بنظام FIFO', 'text', 'text', 'أول داخل أول خارج', 5),
  ('Heap', 'كومة للأولويات والترتيب', 'text', 'text', 'شجرة كاملة مع خاصية الترتيب', 6),
  ('Graph', 'مخطط من العقد والحواف', 'text', 'text', 'يمثل العلاقات المعقدة', 7)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة أزواج للعبة معمارية الحاسوب
WITH architecture_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة معمارية الحاسوب'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  architecture_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM architecture_game,
(VALUES
  ('ALU', 'وحدة الحساب والمنطق', 'text', 'text', 'تنفذ العمليات الحسابية والمنطقية', 1),
  ('Cache', 'ذاكرة تخزين مؤقت سريعة', 'text', 'text', 'تسرع الوصول للبيانات المتكررة', 2),
  ('Pipeline', 'خط الأنابيب لمعالجة التعليمات', 'text', 'text', 'ينفذ عدة تعليمات بالتوازي', 3),
  ('Register', 'سجلات سريعة في المعالج', 'text', 'text', 'تخزن البيانات مؤقتاً أثناء المعالجة', 4),
  ('Bus', 'ناقل البيانات بين المكونات', 'text', 'text', 'يربط أجزاء الحاسوب ببعضها', 5),
  ('Instruction Set', 'مجموعة تعليمات المعالج', 'text', 'text', 'الأوامر التي يفهمها المعالج', 6)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);