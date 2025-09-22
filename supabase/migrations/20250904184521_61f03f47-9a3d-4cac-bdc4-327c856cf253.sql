-- إضافة المراحل الجديدة للمستوى الثاني (5-8)
-- المرحلة 5: طبقات نموذج OSI
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة طبقات نموذج OSI',
  'فهم طبقات نموذج OSI ووظائف كل طبقة',
  '11', 'osi_layers', 'medium', 2, 5, 5, 300, true
);

-- المرحلة 6: بروتوكولات الشبكة المتوسطة
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة بروتوكولات الشبكة المتوسطة',
  'تعلم البروتوكولات المتقدمة ووظائفها في الشبكة',
  '11', 'network_protocols', 'medium', 2, 6, 5, 300, true
);

-- المرحلة 7: مفاهيم التوجيه الأساسية
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة مفاهيم التوجيه الأساسية',
  'فهم كيفية عمل التوجيه في الشبكات',
  '11', 'routing_basics', 'medium', 2, 7, 5, 300, true
);

-- المرحلة 8: إعدادات الأمان المتوسطة
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة إعدادات الأمان المتوسطة',
  'تعلم تقنيات الأمان المتقدمة في الشبكات',
  '11', 'security_intermediate', 'medium', 2, 8, 5, 300, true
);

-- إضافة أزواج المطابقة للمرحلة 5: طبقات نموذج OSI
WITH osi_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة طبقات نموذج OSI'
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
FROM osi_game pg,
(VALUES
  ('Physical Layer', 'طبقة نقل الإشارات الكهربائية والضوئية', 'الطبقة الفيزيائية: أساس النقل المادي', 1),
  ('Data Link Layer', 'طبقة التحكم في الوصول للوسط والإطارات', 'طبقة ربط البيانات: التحكم في الوصول', 2),
  ('Network Layer', 'طبقة التوجيه والعناوين المنطقية IP', 'طبقة الشبكة: التوجيه والعنونة', 3),
  ('Transport Layer', 'طبقة ضمان التسليم الموثوق TCP/UDP', 'طبقة النقل: ضمان التسليم', 4),
  ('Application Layer', 'طبقة التطبيقات والخدمات للمستخدم', 'طبقة التطبيقات: واجهة المستخدم', 5)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 6: بروتوكولات الشبكة المتوسطة
WITH protocols_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة بروتوكولات الشبكة المتوسطة'
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
FROM protocols_game pg,
(VALUES
  ('DHCP', 'بروتوكول توزيع العناوين تلقائياً للأجهزة', 'DHCP: التوزيع التلقائي للعناوين', 1),
  ('DNS', 'بروتوكول ترجمة أسماء النطاقات لعناوين IP', 'DNS: ترجمة أسماء النطاقات', 2),
  ('ARP', 'بروتوكول ربط العناوين المنطقية بالفيزيائية', 'ARP: ربط العناوين المنطقية والفيزيائية', 3),
  ('ICMP', 'بروتوكول رسائل التحكم والأخطاء في الشبكة', 'ICMP: رسائل التحكم والتشخيص', 4),
  ('SNMP', 'بروتوكول إدارة ومراقبة أجهزة الشبكة', 'SNMP: إدارة ومراقبة الشبكة', 5)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 7: مفاهيم التوجيه الأساسية
WITH routing_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم التوجيه الأساسية'
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
FROM routing_game pg,
(VALUES
  ('Static Route', 'مسار ثابت يحدده مدير الشبكة يدوياً', 'المسار الثابت: توجيه يدوي محدد', 1),
  ('Default Route', 'المسار الافتراضي للشبكات غير المعروفة', 'المسار الافتراضي: البوابة للخارج', 2),
  ('Routing Table', 'جدول المسارات المحفوظ في الراوتر', 'جدول التوجيه: خريطة المسارات', 3),
  ('Next Hop', 'عنوان الجهاز التالي في مسار الوصول', 'القفزة التالية: الوجهة المباشرة', 4),
  ('Metric', 'قيمة تكلفة المسار لاختيار الأفضل', 'المقياس: تحديد أفضل مسار', 5)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 8: إعدادات الأمان المتوسطة
WITH security_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة إعدادات الأمان المتوسطة'
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
  ('Access Control List', 'قائمة التحكم بالوصول وفلترة المرور', 'ACL: التحكم في حركة المرور', 1),
  ('Port Security', 'تأمين منافذ السويتش ضد التدخل', 'أمان المنافذ: حماية السويتش', 2),
  ('VLAN', 'الشبكة المحلية الافتراضية لفصل المرور', 'VLAN: الفصل المنطقي للشبكة', 3),
  ('SSH', 'بروتوكول الاتصال الآمن المشفر', 'SSH: الدخول الآمن المشفر', 4),
  ('Enable Password', 'كلمة مرور الوضع المميز في الجهاز', 'كلمة المرور المميزة: حماية الإعدادات', 5)
) AS pairs(left_content, right_content, explanation, order_index);