-- إضافة المراحل الجديدة للمستوى الأول (5-8)
-- المرحلة 5: البروتوكولات الأساسية
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة البروتوكولات الأساسية',
  'تعلم البروتوكولات الشائعة ووظائفها في الشبكات',
  '11', 'protocols', 'easy', 1, 5, 4, 240, true
);

-- المرحلة 6: عناوين IP الأساسية
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة عناوين IP الأساسية',
  'فهم أنواع عناوين IP المختلفة واستخداماتها',
  '11', 'ip_addressing', 'easy', 1, 6, 4, 240, true
);

-- المرحلة 7: الكابلات وأنواعها
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة الكابلات وأنواعها',
  'التعرف على أنواع الكابلات المختلفة في الشبكات',
  '11', 'cables', 'easy', 1, 7, 4, 240, true
);

-- المرحلة 8: المفاهيم الأساسية للأمان
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة مفاهيم الأمان الأساسية',
  'فهم المفاهيم الأساسية لحماية الشبكات',
  '11', 'security_basics', 'easy', 1, 8, 4, 240, true
);

-- إضافة أزواج المطابقة للمرحلة 5: البروتوكولات الأساسية
WITH protocol_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة البروتوكولات الأساسية'
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  pg.id,
  pairs.left_content,
  pairs.right_content,
  'term',
  'definition',
  pairs.explanation,
  pairs.order_index
FROM protocol_game pg,
(VALUES
  ('TCP', 'بروتوكول موثوق للنقل يضمن وصول البيانات', 'TCP: بروتوكول التحكم في النقل الموثوق', 1),
  ('UDP', 'بروتوكول سريع غير موثوق للنقل', 'UDP: بروتوكول البيانات للمستخدم السريع', 2),
  ('HTTP', 'بروتوكول تصفح المواقع والصفحات', 'HTTP: بروتوكول نقل النص التشعبي', 3),
  ('FTP', 'بروتوكول نقل الملفات بين الأجهزة', 'FTP: بروتوكول نقل الملفات', 4)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 6: عناوين IP الأساسية
WITH ip_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة عناوين IP الأساسية'
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  pg.id,
  pairs.left_content,
  pairs.right_content,
  'term',
  'definition',
  pairs.explanation,
  pairs.order_index
FROM ip_game pg,
(VALUES
  ('192.168.1.1', 'عنوان شبكة محلية خاص شائع الاستخدام', '192.168.1.1: عنوان IP محلي خاص', 1),
  ('127.0.0.1', 'عنوان الحاسوب المحلي (localhost)', '127.0.0.1: عنوان الإرجاع المحلي', 2),
  ('8.8.8.8', 'خادم DNS العام من شركة جوجل', '8.8.8.8: خادم أسماء النطاقات من جوجل', 3),
  ('IPv4', 'نظام عناوين الإنترنت 32 بت', 'IPv4: بروتوكول الإنترنت الإصدار الرابع', 4)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 7: الكابلات وأنواعها
WITH cable_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة الكابلات وأنواعها'
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  pg.id,
  pairs.left_content,
  pairs.right_content,
  'term',
  'definition',
  pairs.explanation,
  pairs.order_index
FROM cable_game pg,
(VALUES
  ('كابل مستقيم', 'يربط الحاسوب بالسويتش أو الراوتر', 'الكابل المستقيم: للربط بين أجهزة مختلفة', 1),
  ('كابل متقاطع', 'يربط جهازين من نفس النوع مباشرة', 'الكابل المتقاطع: للربط المباشر بين أجهزة متشابهة', 2),
  ('كابل ألياف بصرية', 'سرعة عالية ومسافات طويلة بدون تدخل', 'الألياف البصرية: تقنية النقل المتطورة', 3),
  ('كابل UTP', 'النوع الأكثر شيوعاً في الشبكات المحلية', 'UTP: الزوج المجدول غير المحمي', 4)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 8: المفاهيم الأساسية للأمان
WITH security_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم الأمان الأساسية'
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  pg.id,
  pairs.left_content,
  pairs.right_content,
  'term',
  'definition',
  pairs.explanation,
  pairs.order_index
FROM security_game pg,
(VALUES
  ('جدار الحماية', 'نظام حماية يمنع التهديدات من دخول الشبكة', 'جدار الحماية: الحارس الأول للشبكة', 1),
  ('كلمة المرور', 'وسيلة المصادقة الأساسية للدخول للأنظمة', 'كلمة المرور: مفتاح الدخول الآمن', 2),
  ('تشفير البيانات', 'حماية المعلومات بتحويلها لشكل غير مقروء', 'التشفير: حماية البيانات أثناء النقل', 3),
  ('WPA2', 'بروتوكول حماية الشبكات اللاسلكية المتقدم', 'WPA2: أمان الشبكات اللاسلكية', 4)
) AS pairs(left_content, right_content, explanation, order_index);