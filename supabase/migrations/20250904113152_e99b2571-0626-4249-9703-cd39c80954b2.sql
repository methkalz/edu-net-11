-- تحديث عدد الأزواج حسب المستوى الجديد
-- المستوى الأول: 4 كلمات
UPDATE pair_matching_games 
SET max_pairs = 4
WHERE title = 'أساسيات الشبكات - المستوى الأول';

-- المستوى الثاني: 5 كلمات
UPDATE pair_matching_games 
SET max_pairs = 5
WHERE title = 'البروتوكولات والطبقات - المستوى الثاني';

-- المستوى الثالث: 6 كلمات
UPDATE pair_matching_games 
SET max_pairs = 6
WHERE title = 'التوجيه والإعدادات المتقدمة - المستوى الثالث';

-- المستوى الرابع: 6 كلمات
UPDATE pair_matching_games 
SET max_pairs = 6
WHERE title = 'الشبكات المتقدمة والأمان - المستوى الرابع';

-- إضافة مصطلحات للمستوى الثالث
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, left_type, right_type)
SELECT 
  (SELECT id FROM pair_matching_games WHERE title = 'التوجيه والإعدادات المتقدمة - المستوى الثالث'),
  term,
  definition,
  'term',
  'definition'
FROM (
  VALUES 
    ('الموجه', 'جهاز يربط بين شبكات متعددة ويوجه حركة البيانات'),
    ('جدول التوجيه', 'قائمة تحتوي على معلومات عن مسارات الشبكة'),
    ('الشبكة الفرعية', 'قسم من شبكة أكبر له عنوان شبكة منفصل'),
    ('قناع الشبكة الفرعية', 'قيمة تحدد جزء الشبكة وجزء المضيف في العنوان'),
    ('البروتوكول الديناميكي', 'بروتوكول يتيح تبادل معلومات التوجيه تلقائياً'),
    ('العبرة الافتراضية', 'المسار المحدد للحزم التي لا تجد مسار معين')
) AS terms(term, definition);

-- إضافة مصطلحات للمستوى الرابع
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, left_type, right_type)
SELECT 
  (SELECT id FROM pair_matching_games WHERE title = 'الشبكات المتقدمة والأمان - المستوى الرابع'),
  term,
  definition,
  'term',
  'definition'
FROM (
  VALUES 
    ('جدار الحماية', 'نظام أمان يراقب ويتحكم في حركة الشبكة'),
    ('الشبكة الافتراضية الخاصة', 'اتصال آمن عبر شبكة عامة'),
    ('التشفير المتماثل', 'نوع من التشفير يستخدم مفتاح واحد للتشفير وفك التشفير'),
    ('المصادقة الثنائية', 'طريقة أمان تتطلب عاملين للتحقق من الهوية'),
    ('كشف التسلل', 'نظام يراقب الأنشطة المشبوهة في الشبكة'),
    ('الشهادة الرقمية', 'وثيقة إلكترونية تؤكد هوية المستخدم أو الخادم')
) AS terms(term, definition);