-- إضافة الأقسام الثلاثة الجديدة
INSERT INTO grade11_sections (title, description, order_index) VALUES 
('Address Resolution Protocol - بروتوكول ARP', 'هذا القسم يشرح العلاقة بين عنوان الـIP وعنوان الـMAC، وكيف يتم استخدام بروتوكول ARP للربط بينهما داخل الشبكة.', 9),
('הגדרה בסיסית של נתב - إعدادات أساسية للراوتر', 'هذا القسم يعرّف الطالب بالخطوات الأولى لإعداد راوتر باستخدام أوامر CLI، من وضع اسم للجهاز إلى ضبط كلمات المرور والتأكد من عمل الواجهات.', 10),
('כתובות IPv4 - عناوين IPv4', 'هذا القسم يشرح تفاصيل بنية عناوين IPv4 وأنواعها، وكيفية تقسيم الشبكات باستخدام Subnetting.', 11);

-- إضافة مواضيع القسم التاسع: Address Resolution Protocol
WITH section9 AS (
  SELECT id FROM grade11_sections WHERE title = 'Address Resolution Protocol - بروتوكول ARP'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s9.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section9 s9,
(VALUES 
  ('MAC & IP', 'في هذا الموضوع نتعرف على كيفية ربط عناوين IP المنطقية بعناوين MAC الفيزيائية، والفرق بين التعامل مع الأجهزة في نفس الشبكة أو في شبكات مختلفة.', 1),
  ('ARP', 'ARP هو بروتوكول يُستخدم لتحويل عنوان IP (المنطقي) إلى عنوان MAC (الفيزيائي) داخل الشبكة المحلية. مهمته ربط العنوانين حتى تعرف الأجهزة كيف تصل لبعضها عبر الشبكة.', 2)
) AS topic_data(title, content, order_index);

-- إضافة مواضيع القسم العاشر: إعدادات أساسية للراوتر
WITH section10 AS (
  SELECT id FROM grade11_sections WHERE title = 'הגדרה בסיסית של נתב - إعدادات أساسية للراوتر'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s10.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section10 s10,
(VALUES 
  ('خطوات أولية في إعداد الراوتر', 'هنا نتعلم الخطوات الأساسية لإعداد راوتر جديد، من إعطائه اسم مميز إلى ضبط كلمات المرور وتأمين طرق الوصول إليه.', 1),
  ('إعدادات الواجهات (הגדרת ממשקים)', 'في هذا الموضوع نتعلم كيفية تفعيل وإعداد واجهات الراوتر، والتحقق من حالتها باستخدام أوامر show المختلفة.', 2)
) AS topic_data(title, content, order_index);

-- إضافة مواضيع القسم الحادي عشر: عناوين IPv4
WITH section11 AS (
  SELECT id FROM grade11_sections WHERE title = 'כתובות IPv4 - عناوين IPv4'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s11.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section11 s11,
(VALUES 
  ('بنية عنوان IPv4 (מבנה כתובת IP גרסה 4)', 'عنوان IPv4 يتكون من قسم يحدد الشبكة وقسم يحدد الجهاز داخل الشبكة. قناع الشبكة يوضح أي جزء من العنوان للشبكة وأي جزء للمضيف.', 1),
  ('أنواع عناوين IP (סוגי כתובות IP)', 'هناك أنواع مختلفة من عناوين IP: Unicast للتواصل بين جهازين، Broadcast للإرسال لجميع الأجهزة، Multicast للإرسال لمجموعة محددة، والعناوين الخاصة والعامة.', 2),
  ('الحاجة للتجزئة (הצורך בסגמנטציה)', 'تقسيم الشبكة الكبيرة إلى شبكات أصغر يُسمى Segmentation. هذا يقلل الازدحام ويجعل الإدارة أسهل ويحسن الأداء العام للشبكة.', 3)
) AS topic_data(title, content, order_index);

-- إضافة دروس القسم التاسع - الموضوع الأول: MAC & IP
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'Address Resolution Protocol - بروتوكول ARP' AND t.title = 'MAC & IP'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('عندما يكون المصدر والوجهة في نفس الشبكة', 'في هذه الحالة يحتاج الجهاز إلى معرفة عنوان MAC للجهاز الآخر ليتمكن من إرسال البيانات عبر الطبقة الثانية. هنا يأتي دور ARP.', 1),
  ('عندما يكون المصدر والوجهة في شبكتين مختلفتين', 'الجهاز يرسل البيانات إلى الراوتر بدلًا من الوجهة مباشرة، لأن الراوتر هو المسؤول عن التوجيه نحو الشبكات البعيدة.', 2)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم التاسع - الموضوع الثاني: ARP
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'Address Resolution Protocol - بروتوكول ARP' AND t.title = 'ARP'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic2 t2,
(VALUES 
  ('نظرة عامة على ARP', 'ARP هو بروتوكول يُستخدم لتحويل عنوان IP (المنطقي) إلى عنوان MAC (الفيزيائي) داخل الشبكة المحلية.', 1),
  ('وظيفة ARP', 'مهمته ربط العنوانين حتى تعرف الأجهزة كيف تصل لبعضها عبر الشبكة. بدون ARP لا يمكن إرسال البيانات داخل نفس الشبكة.', 2),
  ('طلب ARP (ARP Request)', 'الجهاز يرسل رسالة بث (Broadcast) يسأل فيها: "من صاحب هذا الـIP؟ أعطني MAC الخاص بك".', 3),
  ('رد ARP (ARP Reply)', 'الجهاز صاحب الـIP يرد برسالة فيها عنوان MAC الخاص به، ليتم تخزينه في جدول ARP.', 4),
  ('تنظيف جدول ARP', 'الجهاز يحذف العناوين القديمة من جدول ARP بشكل دوري لتجنب الأخطاء.', 5),
  ('جداول ARP على الراوترات والسويتشات', 'كل جهاز شبكي يحتفظ بجدول ARP خاص به ليتعرف على الأجهزة في نفس الشبكة.', 6)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم العاشر - الموضوع الأول: خطوات أولية في إعداد الراوتر
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'הגדרה בסיסית של נתב - إعدادات أساسية للراوتر' AND t.title = 'خطوات أولية في إعداد الراوتر'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('Hostname', 'باستخدام الأمر hostname يمكننا إعطاء الراوتر اسمًا مميزًا يُسهّل التعرف عليه في الشبكة.', 1),
  ('Enable secret', 'هو كلمة مرور مشفرة تُستخدم للدخول إلى الوضع التنفيذي الممتاز (Privileged EXEC Mode).', 2),
  ('line console 0', 'إعدادات الوصول عبر منفذ الكونسول، حيث يتم وضع كلمة مرور للدخول عبر الكابل المباشر.', 3),
  ('line vty 0 4', 'إعدادات الوصول عن بُعد عبر Telnet أو SSH، مع كلمة مرور خاصة بها.', 4),
  ('Banner', 'رسالة تظهر عند تسجيل الدخول، غالبًا للتحذير من الدخول غير المصرّح به.', 5)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم العاشر - الموضوع الثاني: إعدادات الواجهات
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'הגדרה בסיסית של נתב - إعدادات أساسية للراوتر' AND t.title = 'إعدادات الواجهات (הגדרת ממשקים)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic2 t2,
(VALUES 
  ('تفعيل الواجهة', 'باستخدام no shutdown يتم تفعيل المنفذ، وإلا سيبقى مغلقًا حتى لو أُدخلت بقية الإعدادات.', 1),
  ('التحقق من الإعدادات باستخدام أوامر show', 'أوامر مثل: show ip interface brief لعرض حالة المنافذ، show ip route لعرض جدول التوجيه، show interfaces لعرض تفاصيل كل منفذ.', 2),
  ('إعداد البوابة الافتراضية (Default Gateway)', 'تُستخدم البوابة الافتراضية لتوجيه البيانات خارج الشبكة المحلية نحو شبكات أخرى عبر الراوتر.', 3)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم الحادي عشر - الموضوع الأول: بنية عنوان IPv4
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'כתובות IPv4 - عناوين IPv4' AND t.title = 'بنية عنوان IPv4 (מבנה כתובת IP גרסה 4)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('الشبكة والجزء المضيف', 'عنوان IPv4 يتكون من قسم يحدد الشبكة وقسم يحدد الجهاز داخل الشبكة.', 1),
  ('قناع الشبكة (Subnet Mask)', 'قناع الشبكة يوضح أي جزء من العنوان للشبكة وأي جزء للمضيف. مثل 255.255.255.0 يعني أن الثلاثة أوكتتات الأولى للشبكة والأخير للمضيف.', 2),
  ('Prefix وأثره على التقسيم', 'الـ Prefix (مثل /24 أو /16) يحدد طول الجزء الخاص بالشبكة، وكلما كان أطول كانت الشبكة أصغر والمضيفين أقل.', 3),
  ('Anding – تحديد الشبكة', 'عملية Anding بين العنوان وقناع الشبكة تُحدد بدقة أي شبكة ينتمي إليها الجهاز.', 4),
  ('عناوين الشبكة والبث', 'لكل شبكة عنوان خاص بها (Network Address) وعنوان للبث (Broadcast) يُستخدم لإرسال رسالة لجميع الأجهزة داخل الشبكة.', 5)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم الحادي عشر - الموضوع الثاني: أنواع عناوين IP
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'כתובות IPv4 - عناوين IPv4' AND t.title = 'أنواع عناوين IP (סוגי כתובות IP)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic2 t2,
(VALUES 
  ('Unicast', 'إرسال البيانات من جهاز واحد إلى جهاز واحد محدد.', 1),
  ('Broadcast', 'إرسال البيانات من جهاز واحد إلى جميع الأجهزة في نفس الشبكة.', 2),
  ('Multicast', 'إرسال البيانات من جهاز واحد إلى مجموعة معينة من الأجهزة فقط.', 3),
  ('العناوين الخاصة والعامة', 'العناوين الخاصة (Private IP) تُستخدم داخل الشبكات المحلية مثل 192.168.x.x، أما العناوين العامة (Public IP) فتُستخدم للوصول عبر الإنترنت.', 4),
  ('عناوين خاصة إضافية', 'هناك عناوين خاصة مثل Loopback (127.0.0.1) لاختبار الجهاز نفسه، وLink-local (169.254.x.x) تُعطى تلقائيًا عند غياب DHCP.', 5),
  ('تقسيم الشبكات Subnetting', 'يسمح بتقسيم شبكة كبيرة إلى عدة شبكات أصغر لزيادة الكفاءة والأمان.', 6)
) AS lesson_data(title, content, order_index);

-- إضافة دروس القسم الحادي عشر - الموضوع الثالث: الحاجة للتجزئة
WITH topic3 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'כתובות IPv4 - عناوين IPv4' AND t.title = 'الحاجة للتجزئة (הצורך בסגמנטציה)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t3.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic3 t3,
(VALUES 
  ('تقسيم الشبكات إلى مقاطع', 'تقسيم الشبكة الكبيرة إلى شبكات أصغر يُسمى Segmentation. هذا يقلل الازدحام ويجعل الإدارة أسهل.', 1),
  ('مشاكل الشبكات الكبيرة بدون تقسيم', 'الشبكات الكبيرة جدًا تسبب ازدحام وبثوص Broadcast Domain واسع يبطئ الأداء.', 2),
  ('تقسيم الشبكات عبر Subnetting', 'Subnetting هو الحل، حيث نقسم الشبكة عبر تغيير الـ Prefix (/8, /16, /24) حسب الحاجة.', 3)
) AS lesson_data(title, content, order_index);