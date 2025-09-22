-- إضافة القسم الخامس: שיטות מספר – طرق الترقيم
INSERT INTO grade11_sections (title, description, order_index)
VALUES ('שיטות מספר – طرق الترقيم', 'هذا القسم يشرح كيف يتم تمثيل البيانات بالأرقام في الشبكات، وخاصةً عبر النظام الثنائي (Binary System). الطالب سيتعلم كيف تُكتب العناوين، وكيف نميّز بين IPv4 وIPv6.', 5);

-- إضافة القسم السادس: שכבת הקו Data Link Layer – طبقة ربط البيانات
INSERT INTO grade11_sections (title, description, order_index)
VALUES ('שכבת הקו Data Link Layer – طبقة ربط البيانات', 'هذه الطبقة هي الجسر بين الطبقة الفيزيائية والشبكة. مسؤولة عن إرسال البيانات عبر الكابل أو الوسيط اللاسلكي بشكل منظم وآمن.', 6);

-- إضافة القسم السابع: מיתוג Ethernet – التحويل في الإيثرنت
INSERT INTO grade11_sections (title, description, order_index)
VALUES ('מיתוג Ethernet – التحويل في الإيثرنت', 'هذا القسم يوضح كيف يعمل السويتش (Switch) في الشبكات المحلية باستخدام عناوين MAC، وكيف يقرر إلى أي منفذ يُرسل البيانات.', 7);

-- إضافة مواضيع القسم الخامس
WITH section5 AS (
  SELECT id FROM grade11_sections WHERE title = 'שיטות מספר – طرق الترقيم'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s5.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section5 s5,
(VALUES 
  ('الطريقة الثنائية (השיטה הבינארית)', 'الطريقة الثنائية تستخدم رقمين فقط: 0 و1. كل إشارة كهربائية في الحاسوب تمثل إما وجود تيار أو غيابه، ما يجعل النظام الثنائي أساس كل العمليات الرقمية.', 1),
  ('عنوان IPv4 (כתובת IPv4)', 'عنوان IPv4 يحدد هوية كل جهاز على الشبكة. بدون عنوان فريد لن يعرف الجهاز كيف يتواصل مع الآخرين.', 2),
  ('عنوان IPv6 (כתובת IPv6)', 'IPv6 يستخدم نظامًا سداسي عشري بدل العشري. هذا يسمح بكتابة أعداد أكبر بشكل مختصر ويوفر مساحة أكبر للعناوين.', 3)
) AS topic_data(title, content, order_index);

-- إضافة مواضيع القسم السادس
WITH section6 AS (
  SELECT id FROM grade11_sections WHERE title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s6.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section6 s6,
(VALUES 
  ('الهدف من الطبقة الثانية (המטרה של שכבה 2)', 'وظيفتها تنظيم عملية النقل على المستوى الفيزيائي وضمان أن الإطار (Frame) يصل صحيحًا من جهاز لآخر.', 1),
  ('بروتوكول IEEE 802.3 Ethernet', 'هذا هو المعيار الأكثر شيوعًا للشبكات المحلية (LAN). يحدد كيف يتم تقسيم البيانات إلى إطارات Frame وكيف تنتقل عبر الكابل.', 2),
  ('طرق الإرسال Half Duplex / Full Duplex', 'Half Duplex يعني أن الجهاز يمكنه إما الإرسال أو الاستقبال في نفس الوقت، مثل جهاز لاسلكي Walkie-Talkie. Full Duplex يعني أن الجهاز يرسل ويستقبل معًا، مثل الهاتف.', 3),
  ('طرق الوصول إلى القناة (CSMA/CD وCSMA/CA)', 'CSMA/CD كانت تُستخدم في الإيثرنت القديم، الجهاز ينتظر القناة فارغة وإذا حدث تصادم يعيد الإرسال. CSMA/CA تُستخدم في Wi-Fi، تحاول منع التصادم مسبقًا عبر إرسال إشارات تحذير.', 4),
  ('الإطار (Data Link Frame)', 'الإطار هو الوحدة التي تنقل البيانات عبر الطبقة الثانية. يحتوي على عنوان المصدر، عنوان الوجهة، والبيانات.', 5)
) AS topic_data(title, content, order_index);

-- إضافة مواضيع القسم السابع
WITH section7 AS (
  SELECT id FROM grade11_sections WHERE title = 'מיתוג Ethernet – التحويل في الإيثرنت'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s7.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section7 s7,
(VALUES 
  ('مسارات الإيثرنت (מסגרות אתרנט)', 'تتراوح سرعات الإيثرنت من 10 Mbps قديمًا إلى 1 Gbps و10 Gbps في الشبكات الحديثة، وهذا ما يجعل الإنترنت سريعًا اليوم.', 1),
  ('عنوان MAC (כתובת MAC)', 'هو عنوان فريد يُعطى لكل بطاقة شبكة (Network Card). يكتب عادةً بالنظام السداسي العشري مثل 00:1A:2B:3C:4D:5E.', 2),
  ('جدول MAC في السويتش (טבלת ה-MAC במתג)', 'السويتش يخزن عناوين MAC التي يكتشفها في جدول خاص. هذا يساعده في معرفة أين يرسل كل إطار.', 3),
  ('Duplex, Speed & Auto-MDIX', 'Duplex يحدد إذا كان الاتصال Half أو Full. السرعات تحدد سرعة نقل البيانات مثل 100 Mbps أو 1 Gbps. Auto-MDIX ميزة في السويتشات الحديثة تجعلها تحدد تلقائيًا إذا كان الكابل مستقيم أو معكوس وتضبط نفسها بدون تدخل يدوي.', 4)
) AS topic_data(title, content, order_index);

-- إضافة دروس القسم الخامس - الموضوع الأول: الطريقة الثنائية
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שיטות מספר – طرق الترقيم' AND t.title = 'الطريقة الثنائية (השיטה הבינארית)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('ما هي الطريقة الثنائية؟', 'الطريقة الثنائية تستخدم رقمين فقط: 0 و1. كل إشارة كهربائية في الحاسوب تمثل إما وجود تيار أو غيابه، ما يجعل النظام الثنائي أساس كل العمليات الرقمية.', 1),
  ('الأوكتت (Octet)', 'الأوكتت هو مجموعة من 8 بتات (Bits). عندما نرى عنوان IPv4 مثل 192.168.1.1، كل جزء منه هو أوكتت يمثل قيمة من 0 إلى 255.', 2),
  ('العلاقة بين الأرقام الثنائية وعناوين IPv4', 'عنوان IPv4 يتكون من 32 بت، أي 4 أوكتتات. الحاسوب يقرأها بالثنائي لكننا نكتبها بالعشري ليسهل على الإنسان قراءتها.', 3),
  ('قيمة البت في الأوكتت حسب الموقع', 'كل بت له قيمة خاصة: الأول = 128، الثاني = 64، وهكذا حتى 1. بهذه الطريقة نحسب الرقم العشري المقابل للأوكتت.', 4),
  ('التحويل من عشري لثنائي', 'مثال: العدد 13 يُكتب بالثنائي 00001101. هذا يساعدنا على فهم كيف يخزن الحاسوب الأعداد.', 5),
  ('التحويل من ثنائي لعشري', 'نأخذ قيمة البتات المفعلة (1) ونحسب مجموعها. مثل 11000000 = 192. هكذا نعرف كيف تُترجم الأرقام في الشبكات.', 6)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم الخامس - الموضوع الثاني: عنوان IPv4
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שיטות מספר – طرق الترقيم' AND t.title = 'عنوان IPv4 (כתובת IPv4)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  'ما هي عناوين IPv4؟',
  'عنوان IPv4 يحدد هوية كل جهاز على الشبكة. بدون عنوان فريد لن يعرف الجهاز كيف يتواصل مع الآخرين.',
  1
FROM topic2 t2;

-- إضافة دروس القسم الخامس - الموضوع الثالث: عنوان IPv6
WITH topic3 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שיטות מספר – طرق الترقيم' AND t.title = 'عنوان IPv6 (כתובת IPv6)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t3.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic3 t3,
(VALUES 
  ('النظام السداسي العشري (Hexadecimal)', 'IPv6 يستخدم نظامًا سداسي عشري بدل العشري. هذا يسمح بكتابة أعداد أكبر بشكل مختصر.', 1),
  ('التحويل من عشري لسداسي عشري', 'الرقم 255 في IPv4 يمكن أن يُكتب FF في IPv6. هذا يوفر مساحة أكبر للعناوين.', 2),
  ('التحويل من سداسي عشري لعشري', 'مثال: العدد A يساوي 10، والعدد F يساوي 15. بهذه الطريقة نستطيع قراءة عناوين IPv6.', 3)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم السادس
-- الموضوع الأول: الهدف من الطبقة الثانية
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات' AND t.title = 'الهدف من الطبقة الثانية (המטרה של שכבה 2)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  'الهدف من طبقة ربط البيانات',
  'وظيفتها تنظيم عملية النقل على المستوى الفيزيائي وضمان أن الإطار (Frame) يصل صحيحًا من جهاز لآخر.',
  1
FROM topic1 t1;

-- الموضوع الثاني: بروتوكول IEEE 802.3 Ethernet
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات' AND t.title = 'بروتوكول IEEE 802.3 Ethernet'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  'بروتوكول الإيثرنت',
  'هذا هو المعيار الأكثر شيوعًا للشبكات المحلية (LAN). يحدد كيف يتم تقسيم البيانات إلى إطارات Frame وكيف تنتقل عبر الكابل.',
  1
FROM topic2 t2;

-- الموضوع الثالث: طرق الإرسال Half Duplex / Full Duplex
WITH topic3 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات' AND t.title = 'طرق الإرسال Half Duplex / Full Duplex'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t3.id,
  'Half Duplex وFull Duplex',
  'Half Duplex يعني أن الجهاز يمكنه إما الإرسال أو الاستقبال في نفس الوقت، مثل جهاز لاسلكي Walkie-Talkie. Full Duplex يعني أن الجهاز يرسل ويستقبل معًا، مثل الهاتف.',
  1
FROM topic3 t3;

-- الموضوع الرابع: طرق الوصول إلى القناة
WITH topic4 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات' AND t.title = 'طرق الوصول إلى القناة (CSMA/CD وCSMA/CA)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t4.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic4 t4,
(VALUES 
  ('CSMA/CD', 'Carrier Sense Multiple Access with Collision Detection. طريقة كانت تُستخدم في الإيثرنت القديم، الجهاز ينتظر القناة فارغة وإذا حدث تصادم يعيد الإرسال.', 1),
  ('CSMA/CA', 'Carrier Sense Multiple Access with Collision Avoidance. تُستخدم في Wi-Fi، تحاول منع التصادم مسبقًا عبر إرسال إشارات تحذير.', 2)
) AS lesson_data(title, content, order_index);

-- الموضوع الخامس: الإطار
WITH topic5 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات' AND t.title = 'الإطار (Data Link Frame)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t5.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic5 t5,
(VALUES 
  ('ما هو الإطار؟', 'الإطار هو الوحدة التي تنقل البيانات عبر الطبقة الثانية. يحتوي على عنوان المصدر، عنوان الوجهة، والبيانات.', 1),
  ('مكونات الإطار', 'يتكون من Header (رأس) يحتوي على معلومات الوجهة والمصدر، Trailer (ذيل) يحتوي على آلية فحص الأخطاء، والبيانات نفسها في الوسط.', 2)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم السابع
-- الموضوع الأول: مسارات الإيثرنت
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'מיתוג Ethernet – التحويل في الإيثرنت' AND t.title = 'مسارات الإيثرنت (מסגרות אתרנט)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('سرعات الإيثرنت', 'تتراوح من 10 Mbps قديمًا إلى 1 Gbps و10 Gbps في الشبكات الحديثة، وهذا ما يجعل الإنترنت سريعًا اليوم.', 1),
  ('الحقول المختلفة في إطار الإيثرنت', 'الإطار يحتوي على عناوين MAC للمصدر والوجهة، ونوع البروتوكول المستخدم (مثل IPv4 أو IPv6).', 2)
) AS lesson_data(title, content, order_index);

-- الموضوع الثاني: عنوان MAC
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'מיתוג Ethernet – التحويل في الإيثرنت' AND t.title = 'عنوان MAC (כתובת MAC)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic2 t2,
(VALUES 
  ('عنوان MAC', 'هو عنوان فريد يُعطى لكل بطاقة شبكة (Network Card). يكتب عادةً بالنظام السداسي العشري مثل 00:1A:2B:3C:4D:5E.', 1),
  ('عنوان MAC الخاص ببطاقة الشبكة', 'لا يمكن أن يتكرر عالميًا، هو بمثابة "الهوية الشخصية" للجهاز على مستوى الطبقة الثانية.', 2),
  ('كيف يعالج السويتش عنوان MAC', 'السويتش يقرأ عنوان MAC ويقرر عبر أي منفذ يرسل الإطار. هذا يمنع إرسال البيانات لجميع الأجهزة بلا داعٍ.', 3),
  ('Unicast', 'إرسال البيانات من جهاز واحد إلى جهاز آخر محدد.', 4),
  ('Broadcast', 'إرسال البيانات من جهاز واحد إلى كل الأجهزة على نفس الشبكة.', 5),
  ('Multicast', 'إرسال البيانات من جهاز واحد إلى مجموعة محددة من الأجهزة فقط.', 6)
) AS lesson_data(title, content, order_index);

-- الموضوع الثالث: جدول MAC في السويتش
WITH topic3 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'מיתוג Ethernet – التحويل في الإيثرنت' AND t.title = 'جدول MAC في السويتش (טבלת ה-MAC במתג)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t3.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic3 t3,
(VALUES 
  ('جدول MAC', 'السويتش يخزن عناوين MAC التي يكتشفها في جدول خاص. هذا يساعده في معرفة أين يرسل كل إطار.', 1),
  ('عملية التعلم والإرسال (Learning and Forwarding)', 'عندما يستقبل السويتش إطارًا جديدًا، يتعلم عنوان MAC للمصدر ويضيفه للجدول. ثم يقرر الوجهة المناسبة لإرسال الإطار.', 2),
  ('عملية الفحص (Filtering)', 'إذا عرف السويتش أن المصدر والوجهة في نفس المنفذ، يمنع إعادة إرسال الإطار لتجنب الازدحام.', 3)
) AS lesson_data(title, content, order_index);

-- الموضوع الرابع: Duplex, Speed & Auto-MDIX
WITH topic4 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'מיתוג Ethernet – التحويل في الإيثرنت' AND t.title = 'Duplex, Speed & Auto-MDIX'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t4.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic4 t4,
(VALUES 
  ('تعريف Duplex والسرعات', 'Duplex يحدد إذا كان الاتصال Half أو Full. السرعات تحدد سرعة نقل البيانات مثل 100 Mbps أو 1 Gbps.', 1),
  ('Auto-MDIX', 'ميزة في السويتشات الحديثة تجعلها تحدد تلقائيًا إذا كان الكابل مستقيم أو معكوس وتضبط نفسها بدون تدخل يدوي.', 2)
) AS lesson_data(title, content, order_index);