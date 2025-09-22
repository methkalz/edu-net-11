-- Insert Section 12: ICMP – بروتوكول رسائل التحكم
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('ICMP – بروتوكول رسائل التحكم', 'ICMP هو بروتوكول يُستخدم لاختبار الشبكة والتأكد من أن الأجهزة متصلة وقادرة على تبادل البيانات. من خلاله يتم إرسال رسائل خاصة للتأكد من الوصول أو للإشارة إلى وجود خطأ.', 12);

-- Get the section ID for section 12
WITH section_12 AS (
  SELECT id FROM public.grade11_sections WHERE title = 'ICMP – بروتوكول رسائل التحكم'
)
-- Insert topics for Section 12
INSERT INTO public.grade11_topics (section_id, title, content, order_index) 
SELECT 
  section_12.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section_12, (VALUES 
  ('فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)', 'فحص زمن الوصول للمضيف ومدى توفر الأجهزة عبر الشبكة', 1),
  ('اختبارات Ping وTraceroute (בדיקות של PING ו-TRACEROUTE)', 'أدوات اختبار الشبكة والتحقق من المسارات', 2)
) AS topic_data(title, content, order_index);

-- Insert lessons for Section 12
WITH topic_1 AS (
  SELECT id FROM public.grade11_topics WHERE title = 'فحص زمن الوصول للمضيف (בדיקת זמניות של מארח)'
),
topic_2 AS (
  SELECT id FROM public.grade11_topics WHERE title = 'اختبارات Ping وTraceroute (בדיקות של PING ו-TRACEROUTE)'
)
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index)
SELECT 
  CASE 
    WHEN lesson_data.topic_num = 1 THEN topic_1.id
    WHEN lesson_data.topic_num = 2 THEN topic_2.id
  END,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic_1, topic_2, (VALUES 
  (1, 'هل المضيف متاح عبر الشبكة؟', 'عندما نستخدم Ping، الجهاز يرسل رسالة إلى المضيف، فإذا استجاب بالوقت المناسب فهذا يعني أنه متاح عبر الشبكة.', 1),
  (1, 'ماذا يحدث إذا لم يصل الرد؟', 'إذا لم يتم الرد بالوقت المحدد فهذا يشير إلى أن الوجهة غير متاحة أو هناك مشكلة في الطريق.', 2),
  (1, 'ماذا يحدث إذا الخدمة غير متوفرة؟', 'في بعض الحالات يظهر رد بأن الخدمة غير متاحة (Destination Unreachable). هذا يساعد في معرفة نوع المشكلة.', 3),
  (1, 'قياس زمن الرحلة (RTT)', 'الـPing يقيس الوقت بين إرسال الرسالة وتلقي الرد. كلما كان الزمن أقصر، كان الاتصال أسرع وأكثر استقرارًا.', 4),
  (2, 'Ping لعناوين مختلفة', 'يمكن استخدام Ping لاختبار جهازك نفسه عبر loopback (127.0.0.1)، أو البوابة الافتراضية (Gateway)، أو جهاز بعيد في الإنترنت. هذا يساعد في معرفة مكان المشكلة.', 1),
  (2, 'Traceroute', 'Traceroute يوضح المسار الذي تمر فيه الحزم من جهازك حتى الوجهة. كل محطة (Hop) تظهر مع زمن الاستجابة، مما يساعد في تحديد مكان الانقطاع أو البطء.', 2)
) AS lesson_data(topic_num, title, content, order_index);

-- Insert Section 13: Transport Layer – طبقة النقل
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('Transport Layer – طبقة النقل', 'طبقة النقل مسؤولة عن إدارة تدفق البيانات بين التطبيقات. هي التي تضمن أن الرسائل تصل كاملة وصحيحة إلى البرنامج المناسب على الجهاز المستقبل. البروتوكولات الأساسية هنا هي TCP وUDP.', 13);

-- Insert topics for Section 13
WITH section_13 AS (
  SELECT id FROM public.grade11_sections WHERE title = 'Transport Layer – طبقة النقل'
)
INSERT INTO public.grade11_topics (section_id, title, content, order_index) 
SELECT 
  section_13.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section_13, (VALUES 
  ('وظيفة طبقة النقل (תפקיד שכבת התעבורה)', 'دور ووظائف طبقة النقل في الشبكة', 1),
  ('بروتوكولات TCP وUDP (הפרוטוקולים של TCP ו-UDP)', 'مقارنة بين بروتوكولي TCP وUDP', 2),
  ('مقارنة بين TCP وUDP (השוואה בין TCP ל-UDP)', 'الفروقات الأساسية بين البروتوكولين', 3),
  ('متى نستخدم كل بروتوكول؟ (מתי משתמשים בכל פרוטוקול)', 'حالات استخدام كل بروتوكول', 4),
  ('آليات TCP (סקירה של TCP)', 'تفاصيل عمل بروتوكول TCP', 5),
  ('UDP (סקירה של UDP)', 'تفاصيل عمل بروتوكول UDP', 6),
  ('أرقام المنافذ (מספרי פורטים)', 'فهم أرقام المنافذ واستخداماتها', 7)
) AS topic_data(title, content, order_index);

-- Insert Section 14: Application Layer – طبقة التطبيقات
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('Application Layer – طبقة التطبيقات', 'طبقة التطبيقات هي الأقرب للمستخدم. من خلالها نتعامل مع الإنترنت مباشرة عبر بروتوكولات مثل الويب، البريد الإلكتروني، وDNS.', 14);

-- Insert topics for Section 14
WITH section_14 AS (
  SELECT id FROM public.grade11_sections WHERE title = 'Application Layer – طبقة التطبيقات'
)
INSERT INTO public.grade11_topics (section_id, title, content, order_index) 
SELECT 
  section_14.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section_14, (VALUES 
  ('نظرة عامة على طبقة التطبيقات (סקירה של שכבת היישום)', 'مقدمة عن طبقة التطبيقات ودورها', 1),
  ('بروتوكولات مهمة (פרוטוקולים חשובים)', 'البروتوكولات الأساسية في طبقة التطبيقات', 2),
  ('DNS (הודעות DNS ושרתים)', 'نظام أسماء النطاقات وآلية عمله', 3),
  ('DHCP (פרוטוקול DHCP)', 'بروتوكول الحصول على IP تلقائيًا', 4)
) AS topic_data(title, content, order_index);