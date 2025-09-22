-- Insert Section 12: ICMP – بروتوكول رسائل التحكم
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('ICMP – بروتوكول رسائل التحكم', 'ICMP هو بروتوكول يُستخدم لاختبار الشبكة والتأكد من أن الأجهزة متصلة وقادرة على تبادل البيانات. من خلاله يتم إرسال رسائل خاصة للتأكد من الوصول أو للإشارة إلى وجود خطأ.', 12);

-- Insert topics for Section 12
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
((SELECT id FROM public.grade11_sections WHERE title = 'ICMP – بروتوكول رسائل التحكم'), 'فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)', 'فحص زمن الوصول للمضيف ومدى توفر الأجهزة عبر الشبكة', 1),
((SELECT id FROM public.grade11_sections WHERE title = 'ICMP – بروتوكول رسائل التحكم'), 'اختبارات Ping وTraceroute (בדיקות של PING ו-TRACEROUTE)', 'أدوات اختبار الشبكة والتحقق من المسارات', 2);

-- Insert lessons for Section 12
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
-- Topic 1 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)'), 'هل المضيف متاح عبر الشبكة؟', 'عندما نستخدم Ping، الجهاز يرسل رسالة إلى المضيف، فإذا استجاب بالوقت المناسب فهذا يعني أنه متاح عبر الشبكة.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)'), 'ماذا يحدث إذا لم يصل الرد؟', 'إذا لم يتم الرد بالوقت المحدد فهذا يشير إلى أن الوجهة غير متاحة أو هناك مشكلة في الطريق.', 2),
((SELECT id FROM public.grade11_topics WHERE title = 'فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)'), 'ماذا يحدث إذا الخدمة غير متوفرة؟', 'في بعض الحالات يظهر رد بأن الخدمة غير متاحة (Destination Unreachable). هذا يساعد في معرفة نوع المشكلة.', 3),
((SELECT id FROM public.grade11_topics WHERE title = 'فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)'), 'قياس زمن الرحلة (RTT)', 'الـPing يقيس الوقت بين إرسال الرسالة وتلقي الرد. كلما كان الزمن أقصر، كان الاتصال أسرع وأكثر استقرارًا.', 4),
-- Topic 2 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'اختبارات Ping وTraceroute (בדיקות של PING ו-TRACEROUTE)'), 'Ping لعناوين مختلفة', 'يمكن استخدام Ping لاختبار جهازك نفسه عبر loopback (127.0.0.1)، أو البوابة الافتراضية (Gateway)، أو جهاز بعيد في الإنترنت. هذا يساعد في معرفة مكان المشكلة.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'اختبارات Ping وTraceroute (בדיקות של PING ו-TRACEROUTE)'), 'Traceroute', 'Traceroute يوضح المسار الذي تمر فيه الحزم من جهازك حتى الوجهة. كل محطة (Hop) تظهر مع زمن الاستجابة، مما يساعد في تحديد مكان الانقطاع أو البطء.', 2);

-- Insert Section 13: Transport Layer – طبقة النقل
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('Transport Layer – طبقة النقل', 'طبقة النقل مسؤولة عن إدارة تدفق البيانات بين التطبيقات. هي التي تضمن أن الرسائل تصل كاملة وصحيحة إلى البرنامج المناسب على الجهاز المستقبل. البروتوكولات الأساسية هنا هي TCP وUDP.', 13);

-- Insert topics for Section 13
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'وظيفة طبقة النقل (תפקיד שכבת התעבורה)', 'دور ووظائف طبقة النقل في الشبكة', 1),
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'بروتوكولات TCP وUDP (הפרוטוקולים של TCP ו-UDP)', 'مقارنة بين بروتوكولي TCP وUDP', 2),
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'مقارنة بين TCP وUDP (השוואה בין TCP ל-UDP)', 'الفروقات الأساسية بين البروتوكولين', 3),
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'متى نستخدم كل بروتوكول؟ (מתי משתמשים בכל פרוטוקול)', 'حالات استخدام كل بروتوكول', 4),
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'آليات TCP (סקירה של TCP)', 'تفاصيل عمل بروتوكول TCP', 5),
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'UDP (סקירה של UDP)', 'تفاصيل عمل بروتوكول UDP', 6),
((SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'), 'أرقام المنافذ (מספרי פורטים)', 'فهم أرقام المنافذ واستخداماتها', 7);

-- Insert lessons for Section 13
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
-- Topic 1 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'وظيفة طبقة النقل (תפקיד שכבת התעבורה)'), 'دور الطبقة', 'هذه الطبقة تقسم البيانات الكبيرة إلى أجزاء صغيرة (Segments)، وتضيف إليها رؤوس (Headers) تحتوي على معلومات مهمة. كما أنها تتحكم بسرعة النقل وتمنع الازدحام.', 1),
-- Topic 2 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات TCP وUDP (הפרוטוקולים של TCP ו-UDP)'), 'TCP', 'TCP بروتوكول يعتمد على الاتصال الموثوق. يتأكد أن جميع الأجزاء وصلت بالترتيب الصحيح، ويعيد إرسال ما لم يصل. يُستخدم في البريد الإلكتروني وتصفح الإنترنت.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات TCP وUDP (הפרוטוקולים של TCP ו-UDP)'), 'UDP', 'UDP أسرع لكنه غير موثوق. لا يعيد إرسال الأجزاء المفقودة ولا يضمن الترتيب. مناسب للبث المباشر والمكالمات الصوتية.', 2),
-- Topic 3 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'مقارنة بين TCP وUDP (השוואה בין TCP ל-UDP)'), 'الفرق بينهما', 'TCP بطيء نسبيًا لأنه يتأكد من كل جزء، لكنه دقيق. UDP أسرع لأنه لا يتحقق، لكنه قد يسبب فقدان بعض البيانات.', 1),
-- Topic 4 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'متى نستخدم كل بروتوكول؟ (מתי משתמשים בכל פרוטוקול)'), 'حالات الاستخدام', 'TCP مناسب عندما تكون الدقة أهم من السرعة مثل إرسال ملفات أو تصفح الإنترنت. UDP مناسب عندما تكون السرعة أهم مثل الألعاب أو الفيديو المباشر.', 1),
-- Topic 5 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'آليات TCP (סקירה של TCP)'), 'إنشاء الاتصال (Handshake)', 'TCP يبدأ بجولة تحقق من 3 خطوات (3-way handshake) للتأكد من أن الطرف الآخر جاهز.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'آليات TCP (סקירה של TCP)'), 'ضمان وصول البيانات', 'TCP يتأكد أن كل جزء وصل، وإذا لم يصل يعاد إرساله.', 2),
((SELECT id FROM public.grade11_topics WHERE title = 'آليات TCP (סקירה של TCP)'), 'الترتيب الصحيح', 'البيانات تصل بنفس الترتيب الذي أُرسلت به.', 3),
((SELECT id FROM public.grade11_topics WHERE title = 'آليات TCP (סקירה של TCP)'), 'التحكم بالتدفق', 'TCP يضبط سرعة الإرسال حسب قدرة المستقبل حتى لا يحدث ازدحام.', 4),
-- Topic 6 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'UDP (סקירה של UDP)'), 'طريقة عمل UDP', 'البيانات تُرسل كما هي دون تحقق أو ترتيب. هذا يجعله أسرع لكن أقل موثوقية.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'UDP (סקירה של UDP)'), 'متى نستخدمه؟', 'مناسب للتطبيقات التي تتحمل فقدان قليل من البيانات مثل المكالمات الصوتية أو الفيديو المباشر.', 2),
-- Topic 7 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'أرقام المنافذ (מספרי פורטים)'), 'المجموعات', 'هناك منافذ معروفة (Well Known) مثل 80 للـHTTP، منافذ مسجلة (Registered) لتطبيقات محددة، ومنافذ ديناميكية (Dynamic) يستخدمها النظام مؤقتًا.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'أرقام المنافذ (מספרי פורטים)'), 'Socket Pair', 'هو المزيج بين عنوان IP والمنفذ، يحدد اتصالًا معينًا بين جهازين.', 2),
((SELECT id FROM public.grade11_topics WHERE title = 'أرقام المنافذ (מספרי פורטים)'), 'أمر NETSTAT', 'أمر netstat في نظام التشغيل يعرض جميع الاتصالات والمنافذ المفتوحة، مما يساعد في مراقبة الشبكة.', 3);

-- Insert Section 14: Application Layer – طبقة التطبيقات
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('Application Layer – طبقة التطبيقات', 'طبقة التطبيقات هي الأقرب للمستخدم. من خلالها نتعامل مع الإنترنت مباشرة عبر بروتوكولات مثل الويب، البريد الإلكتروني، وDNS.', 14);

-- Insert topics for Section 14
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
((SELECT id FROM public.grade11_sections WHERE title = 'Application Layer – طبقة التطبيقات'), 'نظرة عامة على طبقة التطبيقات (סקירה של שכבת היישום)', 'مقدمة عن طبقة التطبيقات ودورها', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'Application Layer – طبقة التطبيقات'), 'بروتوكولات مهمة (פרוטוקולים חשובים)', 'البروتوكولات الأساسية في طبقة التطبيقات', 2),
((SELECT id FROM public.grade11_topics WHERE title = 'Application Layer – طبقة التطبيقات'), 'DNS (הודעות DNS ושרתים)', 'نظام أسماء النطاقات وآلية عمله', 3),
((SELECT id FROM public.grade11_topics WHERE title = 'Application Layer – طبقة التطبيقات'), 'DHCP (פרוטוקול DHCP)', 'بروتوكول الحصول على IP تلقائيًا', 4);

-- Insert lessons for Section 14
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
-- Topic 1 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'نظرة عامة على طبقة التطبيقات (סקירה של שכבת היישום)'), 'دور الطبقة', 'هذه الطبقة تجعل البرامج مثل المتصفحات أو تطبيقات البريد قادرة على استخدام الشبكة بسهولة دون القلق من التفاصيل التقنية.', 1),
-- Topic 2 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'DNS – المنفذ 53', 'يحوّل أسماء المواقع مثل google.com إلى عناوين IP.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'DHCP – المنافذ 67/68', 'يوزع عناوين IP تلقائيًا على الأجهزة المتصلة بالشبكة.', 2),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'SMTP – المنفذ 25', 'يرسل رسائل البريد الإلكتروني من جهاز إلى خادم البريد.', 3),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'POP3 – المنفذ 110', 'يسمح بتحميل الرسائل من الخادم إلى الجهاز.', 4),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'IMAP – المنفذ 143', 'يتيح قراءة البريد من الخادم مباشرة مع بقاء الرسائل هناك.', 5),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'FTP – المنافذ 20/21', 'يُستخدم لنقل الملفات بين جهاز وخادم.', 6),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'TFTP – المنفذ 69', 'نسخة أبسط من FTP تُستخدم لنقل ملفات صغيرة مثل إعدادات.', 7),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'HTTP – المنفذ 80', 'البروتوكول الأساسي لعرض صفحات الويب.', 8),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'HTTPS – المنفذ 443', 'نسخة مشفرة من HTTP لحماية البيانات.', 9),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'SSH – المنفذ 22', 'إدارة آمنة للأجهزة عن بُعد.', 10),
((SELECT id FROM public.grade11_topics WHERE title = 'بروتوكولات مهمة (פרוטוקולים חשובים)'), 'TELNET – المنفذ 23', 'إدارة أجهزة عن بُعد لكنه غير آمن، لذلك نادر الاستخدام اليوم.', 11),
-- Topic 3 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'DNS (הודעות DNS ושרתים)'), 'رسالة DNS', 'عندما تكتب اسم موقع، يُرسل جهازك طلب DNS ويحصل على عنوان IP المناسب.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'DNS (הודעות DNS ושרתים)'), 'البنية الهرمية لـDNS', 'DNS يعمل كبنية شجرية تبدأ من الخوادم الجذرية (Root Servers) ثم خوادم المستوى الأعلى مثل .com وصولًا إلى الخادم الخاص بالموقع.', 2),
((SELECT id FROM public.grade11_topics WHERE title = 'DNS (הודעות DNS ושרתים)'), 'أمر NSLOOKUP', 'أداة في أنظمة التشغيل تسمح بالتحقق يدويًا من ترجمة اسم نطاق إلى IP.', 3),
-- Topic 4 lessons
((SELECT id FROM public.grade11_topics WHERE title = 'DHCP (פרוטוקול DHCP)'), 'بروتوكول DHCP', 'هو المسؤول عن إعطاء عنوان IP لكل جهاز يدخل الشبكة دون الحاجة للإعداد اليدوي.', 1),
((SELECT id FROM public.grade11_topics WHERE title = 'DHCP (פרוטוקול DHCP)'), 'عملية DHCP', 'تمر بأربع خطوات: Discover (البحث)، Offer (عرض عنوان)، Request (طلب العنوان)، Acknowledge (تأكيد).', 2);