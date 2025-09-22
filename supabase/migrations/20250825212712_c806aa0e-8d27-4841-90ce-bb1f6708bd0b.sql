-- Insert lessons for Section 13: Transport Layer
WITH transport_topics AS (
  SELECT t.id, t.title, ROW_NUMBER() OVER (ORDER BY t.order_index) as topic_num
  FROM grade11_topics t
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'Transport Layer – طبقة النقل'
  ORDER BY t.order_index
)
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index)
SELECT 
  transport_topics.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM transport_topics
JOIN (VALUES 
  (1, 'دور الطبقة', 'هذه الطبقة تقسم البيانات الكبيرة إلى أجزاء صغيرة (Segments)، وتضيف إليها رؤوس (Headers) تحتوي على معلومات مهمة. كما أنها تتحكم بسرعة النقل وتمنع الازدحام.', 1),
  (2, 'TCP', 'TCP بروتوكول يعتمد على الاتصال الموثوق. يتأكد أن جميع الأجزاء وصلت بالترتيب الصحيح، ويعيد إرسال ما لم يصل. يُستخدم في البريد الإلكتروني وتصفح الإنترنت.', 1),
  (2, 'UDP', 'UDP أسرع لكنه غير موثوق. لا يعيد إرسال الأجزاء المفقودة ولا يضمن الترتيب. مناسب للبث المباشر والمكالمات الصوتية.', 2),
  (3, 'الفرق بينهما', 'TCP بطيء نسبيًا لأنه يتأكد من كل جزء، لكنه دقيق. UDP أسرع لأنه لا يتحقق، لكنه قد يسبب فقدان بعض البيانات.', 1),
  (4, 'حالات الاستخدام', 'TCP مناسب عندما تكون الدقة أهم من السرعة مثل إرسال ملفات أو تصفح الإنترنت. UDP مناسب عندما تكون السرعة أهم مثل الألعاب أو الفيديو المباشر.', 1),
  (5, 'إنشاء الاتصال (Handshake)', 'TCP يبدأ بجولة تحقق من 3 خطوات (3-way handshake) للتأكد من أن الطرف الآخر جاهز.', 1),
  (5, 'ضمان وصول البيانات', 'TCP يتأكد أن كل جزء وصل، وإذا لم يصل يعاد إرساله.', 2),
  (5, 'الترتيب الصحيح', 'البيانات تصل بنفس الترتيب الذي أُرسلت به.', 3),
  (5, 'التحكم بالتدفق', 'TCP يضبط سرعة الإرسال حسب قدرة المستقبل حتى لا يحدث ازدحام.', 4),
  (6, 'طريقة عمل UDP', 'البيانات تُرسل كما هي دون تحقق أو ترتيب. هذا يجعله أسرع لكن أقل موثوقية.', 1),
  (6, 'متى نستخدمه؟', 'مناسب للتطبيقات التي تتحمل فقدان قليل من البيانات مثل المكالمات الصوتية أو الفيديو المباشر.', 2),
  (7, 'المجموعات', 'هناك منافذ معروفة (Well Known) مثل 80 للـHTTP، منافذ مسجلة (Registered) لتطبيقات محددة، ومنافذ ديناميكية (Dynamic) يستخدمها النظام مؤقتًا.', 1),
  (7, 'Socket Pair', 'هو المزيج بين عنوان IP والمنفذ، يحدد اتصالًا معينًا بين جهازين.', 2),
  (7, 'أمر NETSTAT', 'أمر netstat في نظام التشغيل يعرض جميع الاتصالات والمنافذ المفتوحة، مما يساعد في مراقبة الشبكة.', 3)
) AS lesson_data(topic_num, title, content, order_index) 
ON transport_topics.topic_num = lesson_data.topic_num;

-- Insert lessons for Section 14: Application Layer
WITH app_topics AS (
  SELECT t.id, t.title, ROW_NUMBER() OVER (ORDER BY t.order_index) as topic_num
  FROM grade11_topics t
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'Application Layer – طبقة التطبيقات'
  ORDER BY t.order_index
)
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index)
SELECT 
  app_topics.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM app_topics
JOIN (VALUES 
  (1, 'دور الطبقة', 'هذه الطبقة تجعل البرامج مثل المتصفحات أو تطبيقات البريد قادرة على استخدام الشبكة بسهولة دون القلق من التفاصيل التقنية.', 1),
  (2, 'DNS – المنفذ 53', 'يحوّل أسماء المواقع مثل google.com إلى عناوين IP.', 1),
  (2, 'DHCP – المنافذ 67/68', 'يوزع عناوين IP تلقائيًا على الأجهزة المتصلة بالشبكة.', 2),
  (2, 'SMTP – المنفذ 25', 'يرسل رسائل البريد الإلكتروني من جهاز إلى خادم البريد.', 3),
  (2, 'POP3 – المنفذ 110', 'يسمح بتحميل الرسائل من الخادم إلى الجهاز.', 4),
  (2, 'IMAP – المنفذ 143', 'يتيح قراءة البريد من الخادم مباشرة مع بقاء الرسائل هناك.', 5),
  (2, 'FTP – المنافذ 20/21', 'يُستخدم لنقل الملفات بين جهاز وخادم.', 6),
  (2, 'TFTP – المنفذ 69', 'نسخة أبسط من FTP تُستخدم لنقل ملفات صغيرة مثل إعدادات.', 7),
  (2, 'HTTP – المنفذ 80', 'البروتوكول الأساسي لعرض صفحات الويب.', 8),
  (2, 'HTTPS – المنفذ 443', 'نسخة مشفرة من HTTP لحماية البيانات.', 9),
  (2, 'SSH – المنفذ 22', 'إدارة آمنة للأجهزة عن بُعد.', 10),
  (2, 'TELNET – المنفذ 23', 'إدارة أجهزة عن بُعد لكنه غير آمن، لذلك نادر الاستخدام اليوم.', 11),
  (3, 'رسالة DNS', 'عندما تكتب اسم موقع، يُرسل جهازك طلب DNS ويحصل على عنوان IP المناسب.', 1),
  (3, 'البنية الهرمية لـDNS', 'DNS يعمل كبنية شجرية تبدأ من الخوادم الجذرية (Root Servers) ثم خوادم المستوى الأعلى مثل .com وصولًا إلى الخادم الخاص بالموقع.', 2),
  (3, 'أمر NSLOOKUP', 'أداة في أنظمة التشغيل تسمح بالتحقق يدويًا من ترجمة اسم نطاق إلى IP.', 3),
  (4, 'بروتوكول DHCP', 'هو المسؤول عن إعطاء عنوان IP لكل جهاز يدخل الشبكة دون الحاجة للإعداد اليدوي.', 1),
  (4, 'عملية DHCP', 'تمر بأربع خطوات: Discover (البحث)، Offer (عرض عنوان)، Request (طلب العنوان)، Acknowledge (تأكيد).', 2)
) AS lesson_data(topic_num, title, content, order_index) 
ON app_topics.topic_num = lesson_data.topic_num;