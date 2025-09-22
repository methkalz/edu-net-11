-- إضافة ألعاب متوسطة إضافية (Medium Level)
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
  'مطابقة بروتوكولات الشبكة',
  'تعلم البروتوكولات المختلفة المستخدمة في الشبكات',
  '11',
  'networks',
  'medium',
  6,
  360,
  true
),
(
  gen_random_uuid(),
  'مطابقة لغات البرمجة',
  'تعرف على خصائص لغات البرمجة المختلفة',
  '11',
  'programming',
  'medium',
  6,
  360,
  true
);

-- إضافة أزواج للعبة بروتوكولات الشبكة
WITH protocols_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة بروتوكولات الشبكة'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  protocols_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM protocols_game,
(VALUES
  ('HTTP', 'بروتوكول نقل النصوص التشعبية', 'text', 'text', 'يستخدم لتصفح المواقع الإلكترونية', 1),
  ('HTTPS', 'بروتوكول HTTP الآمن بالتشفير', 'text', 'text', 'نسخة مشفرة من HTTP للحماية', 2),
  ('FTP', 'بروتوكول نقل الملفات', 'text', 'text', 'يستخدم لرفع وتحميل الملفات', 3),
  ('TCP', 'بروتوكول التحكم في الإرسال', 'text', 'text', 'يضمن وصول البيانات بشكل موثوق', 4),
  ('UDP', 'بروتوكول البيانات التسلسلي', 'text', 'text', 'إرسال سريع بدون ضمان الوصول', 5),
  ('SMTP', 'بروتوكول إرسال البريد الإلكتروني', 'text', 'text', 'يستخدم لإرسال الرسائل الإلكترونية', 6)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة أزواج للعبة لغات البرمجة
WITH languages_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة لغات البرمجة'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  languages_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM languages_game,
(VALUES
  ('Python', 'لغة برمجة سهلة ومتعددة الاستخدامات', 'text', 'text', 'مثالية للمبتدئين وعلوم البيانات', 1),
  ('Java', 'لغة برمجة كائنية قوية ومحمولة', 'text', 'text', 'تعمل على أي نظام تشغيل', 2),
  ('JavaScript', 'لغة برمجة لتطوير المواقع التفاعلية', 'text', 'text', 'أساسية لتطوير الويب', 3),
  ('C++', 'لغة برمجة سريعة للتطبيقات المعقدة', 'text', 'text', 'تستخدم في الألعاب والأنظمة', 4),
  ('HTML', 'لغة ترميز لبناء صفحات الويب', 'text', 'text', 'تحدد بنية المحتوى على الإنترنت', 5),
  ('CSS', 'لغة تنسيق لتجميل صفحات الويب', 'text', 'text', 'تتحكم في مظهر وتصميم المواقع', 6)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);