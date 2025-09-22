-- إنشاء المستوى الثالث (الصعب) - 4 مراحل متقدمة
-- المرحلة 1: بروتوكولات التوجيه المتقدمة
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة بروتوكولات التوجيه المتقدمة',
  'فهم بروتوكولات التوجيه الديناميكية المعقدة',
  '11', 'advanced_routing', 'hard', 3, 1, 5, 360, true
);

-- المرحلة 2: شبكات VLAN والتحويل المتقدم
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة شبكات VLAN والتحويل المتقدم',
  'إتقان مفاهيم VLAN والتقنيات المتقدمة',
  '11', 'advanced_switching', 'hard', 3, 2, 5, 360, true
);

-- المرحلة 3: أمان الشبكات المتقدم
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة أمان الشبكات المتقدم',
  'التعمق في تقنيات الحماية والأمان المتطورة',
  '11', 'advanced_security', 'hard', 3, 3, 5, 360, true
);

-- المرحلة 4: استكشاف الأخطاء وإدارة الأداء
INSERT INTO pair_matching_games (
  title, description, grade_level, subject, difficulty_level, 
  level_number, stage_number, max_pairs, time_limit_seconds, is_active
) VALUES (
  'مطابقة استكشاف الأخطاء وإدارة الأداء',
  'أدوات وتقنيات تشخيص ومراقبة الشبكات',
  '11', 'troubleshooting', 'hard', 3, 4, 5, 360, true
);

-- إضافة أزواج المطابقة للمرحلة 1: بروتوكولات التوجيه المتقدمة
WITH routing_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة بروتوكولات التوجيه المتقدمة'
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
  ('OSPF', 'بروتوكول تحديد أقصر مسار أولاً للشبكات الداخلية', 'OSPF: التوجيه الأمثل داخل النطاق', 1),
  ('EIGRP', 'بروتوكول التوجيه المتقدم المملوك لشركة سيسكو', 'EIGRP: التوجيه المتقدم من سيسكو', 2),
  ('BGP', 'بروتوكول البوابة الحدودية للتوجيه بين مقدمي الخدمة', 'BGP: التوجيه بين الشبكات العالمية', 3),
  ('RIP', 'بروتوكول معلومات التوجيه البسيط القديم', 'RIP: بروتوكول التوجيه التقليدي', 4),
  ('Convergence', 'وصول جميع الراوترات لحالة متفقة في الشبكة', 'التقارب: استقرار معلومات التوجيه', 5)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 2: شبكات VLAN والتحويل المتقدم
WITH vlan_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة شبكات VLAN والتحويل المتقدم'
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
FROM vlan_game pg,
(VALUES
  ('Trunking', 'نقل عدة VLANs عبر رابط شبكة واحد', 'الجذع: نقل شبكات متعددة في رابط واحد', 1),
  ('VTP', 'بروتوكول تشذيب وإدارة معلومات VLAN', 'VTP: إدارة مركزية لشبكات VLAN', 2),
  ('STP', 'بروتوكول منع الحلقات في الشبكات المحولة', 'STP: منع الحلقات والازدواجية', 3),
  ('Inter-VLAN Routing', 'التوجيه بين الشبكات الافتراضية المختلفة', 'التوجيه بين VLANs: الربط المنطقي', 4),
  ('802.1Q', 'معيار IEEE لتغليف وترقيم VLAN', '802.1Q: معيار تغليف الشبكات الافتراضية', 5)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 3: أمان الشبكات المتقدم
WITH security_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة أمان الشبكات المتقدم'
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
  ('IPSec', 'بروتوكول أمان الإنترنت المشفر من النهاية للنهاية', 'IPSec: تشفير شامل للاتصالات', 1),
  ('VPN', 'الشبكة الخاصة الافتراضية الآمنة عبر الإنترنت', 'VPN: النفق الآمن عبر الشبكة العامة', 2),
  ('IDS/IPS', 'أنظمة كشف ومنع التسلل والهجمات', 'IDS/IPS: الحراسة الذكية للشبكة', 3),
  ('DMZ', 'المنطقة المنزوعة السلاح لعزل الخوادم العامة', 'DMZ: المنطقة الوسطية الآمنة', 4),
  ('NAT/PAT', 'تحويل عناوين الشبكة والمنافذ للحماية', 'NAT/PAT: إخفاء هوية الشبكة الداخلية', 5)
) AS pairs(left_content, right_content, explanation, order_index);

-- إضافة أزواج المطابقة للمرحلة 4: استكشاف الأخطاء وإدارة الأداء
WITH troubleshooting_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة استكشاف الأخطاء وإدارة الأداء'
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
FROM troubleshooting_game pg,
(VALUES
  ('Ping', 'أداة فحص الاتصال الأساسية باستخدام ICMP', 'Ping: الفحص الأولي للاتصال', 1),
  ('Traceroute', 'تتبع مسار الحزم عبر أجهزة الشبكة', 'Traceroute: رسم خريطة المسار', 2),
  ('Wireshark', 'محلل حزم الشبكة المتقدم لفحص البيانات', 'Wireshark: المجهر الرقمي للشبكة', 3),
  ('SNMP Monitoring', 'مراقبة أداء وحالة أجهزة الشبكة تلقائياً', 'مراقبة SNMP: العين الساهرة على الشبكة', 4),
  ('Quality of Service', 'ضمان جودة الخدمة وأولوية التطبيقات', 'QoS: تحديد أولويات حركة المرور', 5)
) AS pairs(left_content, right_content, explanation, order_index);