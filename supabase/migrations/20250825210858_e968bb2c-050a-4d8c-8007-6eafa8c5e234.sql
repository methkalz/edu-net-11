-- إضافة القسم الثامن: שכבת הרשת - طبقة الشبكة
INSERT INTO grade11_sections (title, description, order_index)
VALUES ('שכבת הרשת - طبقة الشبكة (Network Layer)', 'طبقة الشبكة مسؤولة عن تحديد المسار الذي تسلكه البيانات من جهاز إلى آخر في الشبكات المحلية أو عبر الإنترنت. هنا نتعرف على بروتوكولات IPv4 وIPv6، بنية الحزم (Packets)، وعملية التوجيه (Routing) التي تحدد الطريق الأفضل للبيانات.', 8);

-- إضافة مواضيع القسم الثامن
WITH section8 AS (
  SELECT id FROM grade11_sections WHERE title = 'שכבת הרשת - طبقة الشبكة (Network Layer)'
)
INSERT INTO grade11_topics (section_id, title, content, order_index)
SELECT 
  s8.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section8 s8,
(VALUES 
  ('مكوّنات طبقة الشبكة (תכונות שכבת הרשת)', 'البروتوكولات تحدد القواعد التي تنظّم نقل البيانات عبر الشبكة. IPv4 هو البروتوكول الأقدم والأكثر استخدامًا، بينما IPv6 جاء ليعالج مشكلة نقص العناوين ويوفر مساحة أكبر بكثير.', 1),
  ('الحزمة/الـ Packet – الإصدار 4 (מנה/חבילה גרסה 4)', 'الـ Header هو الجزء الأول من الحزمة ويحتوي على معلومات أساسية مثل الإصدار (Version)، وقت الحياة (TTL)، البروتوكول المستخدم، عنوان المصدر وعنوان الوجهة.', 2),
  ('الحزمة/الـ Packet – الإصدار 6 (מנה/חבילה גרסה 6)', 'IPv6 يستخدم عناوين أطول (128 بت بدلًا من 32 بت). هذا يعني أن عدد العناوين الممكنة يكاد يكون غير محدود، ما يضمن استمرارية الإنترنت في المستقبل.', 3),
  ('كيف يقرر الراوتر (מחשב נתב) التوجيه', 'الراوتر يحدد الطريق حسب عنوان الوجهة. إذا كان العنوان محليًا يوجهه داخل الشبكة، وإذا كان بعيدًا يستخدم جداول التوجيه لإرساله عبر شبكة أخرى.', 4),
  ('لمحة عن التوجيه (מבוא לניתוב)', 'التوجيه هو العملية التي تضمن أن البيانات تصل من المرسل إلى المستقبل عبر أقصر وأسرع طريق ممكن. بدونه ستضيع البيانات أو تتوقف الشبكة عن العمل.', 5)
) AS topic_data(title, content, order_index);

-- إضافة دروس الموضوع الأول: مكوّنات طبقة الشبكة
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הרשת - طبقة الشبكة (Network Layer)' AND t.title = 'مكوّنات طبقة الشبكة (תכונות שכבת הרשת)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('بروتوكولات IPv4 وIPv6', 'البروتوكولات تحدد القواعد التي تنظّم نقل البيانات عبر الشبكة. IPv4 هو البروتوكول الأقدم والأكثر استخدامًا، بينما IPv6 جاء ليعالج مشكلة نقص العناوين ويوفر مساحة أكبر بكثير.', 1),
  ('هدف العناوين في الشبكة', 'كل جهاز يحتاج عنوان IP فريد ليتمكن من إرسال البيانات واستقبالها. العنوان يحدد مصدر البيانات ووجهتها، ويسمح بالتوجيه الصحيح من جهاز إلى آخر.', 2)
) AS lesson_data(title, content, order_index);

-- إضافة دروس الموضوع الثاني: الحزمة/الـ Packet – الإصدار 4
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הרשת - طبقة الشبكة (Network Layer)' AND t.title = 'الحزمة/الـ Packet – الإصدار 4 (מנה/חבילה גרסה 4)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic2 t2,
(VALUES 
  ('الـ Header في IPv4', 'الـ Header هو الجزء الأول من الحزمة ويحتوي على معلومات أساسية مثل الإصدار (Version)، وقت الحياة (TTL)، البروتوكول المستخدم، عنوان المصدر وعنوان الوجهة. هذه المعلومات تسمح للشبكة بتحديد كيفية معالجة الحزمة.', 1),
  ('حدود IPv4', 'إجمالي عدد عناوين IPv4 محدود بـ 4.3 مليار فقط. هذا الرقم لم يعد كافيًا مع الزيادة الهائلة في عدد الأجهزة المتصلة بالإنترنت.', 2)
) AS lesson_data(title, content, order_index);

-- إضافة دروس الموضوع الثالث: الحزمة/الـ Packet – الإصدار 6
WITH topic3 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הרשת - طبقة الشبكة (Network Layer)' AND t.title = 'الحزمة/الـ Packet – الإصدار 6 (מנה/חבילה גרסה 6)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t3.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic3 t3,
(VALUES 
  ('نظرة عامة على IPv6', 'IPv6 يستخدم عناوين أطول (128 بت بدلًا من 32 بت). هذا يعني أن عدد العناوين الممكنة يكاد يكون غير محدود، ما يضمن استمرارية الإنترنت في المستقبل.', 1),
  ('التحقق من صحة عنوان IPv6', 'عناوين IPv6 تُكتب بالنظام السداسي العشري. على الطالب أن يعرف كيف يميز العنوان الصحيح، مثل التأكد من عدد المقاطع والشكل العام.', 2),
  ('اختصار عناوين IPv6', 'يمكن اختصار العنوان الطويل باستخدام قواعد مثل حذف الأصفار المتكررة. مثلًا: 2001:0db8:0000:0000:0000:0000:0000:1 يمكن كتابته كـ 2001:db8::1.', 3),
  ('مدى العناوين في IPv6', 'العناوين في IPv6 تُقسّم حسب الاستخدام: عناوين مخصّصة لجهاز واحد (Unicast)، أو لمجموعة أجهزة (Multicast)، أو لشبكة بأكملها.', 4),
  ('مقارنة بين Header IPv4 وIPv6', 'Header IPv6 أبسط وأصغر من حيث عدد الحقول، لكنه يسمح بمرونة أكبر وإضافة امتدادات عند الحاجة، ما يجعله أكثر كفاءة في التوجيه.', 5)
) AS lesson_data(title, content, order_index);

-- إضافة دروس الموضوع الرابع: كيف يقرر الراوتر التوجيه
WITH topic4 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הרשת - طبقة الشبكة (Network Layer)' AND t.title = 'كيف يقرر الراوتر (מחשב נתב) التوجيه'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t4.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic4 t4,
(VALUES 
  ('آلية اتخاذ القرار في الراوتر', 'الراوتر يحدد الطريق حسب عنوان الوجهة. إذا كان العنوان محليًا يوجهه داخل الشبكة، وإذا كان بعيدًا يستخدم جداول التوجيه لإرساله عبر شبكة أخرى.', 1),
  ('جداول التوجيه (Routing Tables)', 'هي قاعدة بيانات داخل الراوتر تحتوي على المسارات المختلفة. كل مسار يوضح الوجهة والطريق الأنسب للوصول إليها.', 2),
  ('بروتوكولات التوجيه', 'هناك بروتوكولات ديناميكية (Dynamic) مثل OSPF وEIGRP التي تحدّث نفسها تلقائيًا، وأخرى ثابتة (Static) يُدخلها مدير الشبكة يدويًا.', 3)
) AS lesson_data(title, content, order_index);

-- إضافة دروس الموضوع الخامس: لمحة عن التوجيه
WITH topic5 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'שכבת הרשת - طبقة الشبكة (Network Layer)' AND t.title = 'لمحة عن التوجيه (מבוא לניתוב)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t5.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic5 t5,
(VALUES 
  ('أهمية التوجيه', 'التوجيه هو العملية التي تضمن أن البيانات تصل من المرسل إلى المستقبل عبر أقصر وأسرع طريق ممكن. بدونه ستضيع البيانات أو تتوقف الشبكة عن العمل.', 1),
  ('أنواع جداول التوجيه', 'جداول التوجيه تشمل شبكات محلية مباشرة، شبكات بعيدة تحتاج إلى وسيط، ومسارات افتراضية يتم استخدامها كخيار أخير إذا لم يوجد مسار محدد.', 2),
  ('التوجيه الديناميكي مقابل الثابت', 'التوجيه الثابت يعتمد على إدخال يدوي من المدير، بينما التوجيه الديناميكي يستخدم بروتوكولات لتحديث الطرق تلقائيًا حسب تغييرات الشبكة.', 3)
) AS lesson_data(title, content, order_index);