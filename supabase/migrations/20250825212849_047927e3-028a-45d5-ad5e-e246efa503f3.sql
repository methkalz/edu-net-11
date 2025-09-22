-- Insert Section 15: הגדרות ראשוניות במתג/נתב - الإعدادات الأولية في السويتش/الراوتر
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('הגדרות ראשוניות במתג/נתב - الإعدادات الأولية في السويتش/الراوتر', 'هذا القسم يوضح الخطوات الأساسية لبدء العمل مع جهاز الشبكة مثل السويتش أو الراوتر، من لحظة التشغيل وحتى اختبار الإعدادات.', 15);

-- Insert topics for Section 15
WITH section_15 AS (
  SELECT id FROM public.grade11_sections WHERE title = 'הגדרות ראשוניות במתג/נתב - الإعدادات الأولية في السويتش/الراوتر'
)
INSERT INTO public.grade11_topics (section_id, title, content, order_index) 
SELECT 
  section_15.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section_15, (VALUES 
  ('الإعدادات الأولية للسويتش (הגדרה ראשונית של מתג)', 'الخطوات الأساسية لإعداد السويتش والتحقق من حالته', 1),
  ('إعداد المنافذ على السويتش (הגדרת הפורטים על המתג)', 'كيفية إعداد وإدارة منافذ السويتش', 2),
  ('اتصال آمن للإدارة (חיבור מאובטח להתקון)', 'طرق الاتصال الآمن لإدارة الأجهزة عن بُعد', 3),
  ('الإعدادات الأساسية للراوتر (הגדרה בסיסית של נתב)', 'الإعدادات الأولية المطلوبة للراوتر', 4),
  ('أوامر التحقق من حالة التشغيل (פקודות לאימות מצב ממשק)', 'أوامر مراقبة والتحقق من حالة الأجهزة', 5)
) AS topic_data(title, content, order_index);

-- Insert lessons for Section 15
WITH section_topics AS (
  SELECT t.id, t.title, ROW_NUMBER() OVER (ORDER BY t.order_index) as topic_num
  FROM grade11_topics t
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'הגדרות ראשוניות במתג/נתב - الإعدادات الأولية في السويتش/الراوتر'
  ORDER BY t.order_index
)
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index)
SELECT 
  section_topics.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM section_topics
JOIN (VALUES 
  -- Topic 1: الإعدادات الأولية للسويتش
  (1, 'تسلسل إقلاع السويتش (BOOT)', 'عند تشغيل السويتش يمر بعدة خطوات: اختبار ذاتي (POST)، تحميل نظام التشغيل (IOS)، ثم تشغيل الإعدادات المخزنة.', 1),
  (1, 'مصابيح LED على السويتش', 'المصابيح تُظهر حالة الجهاز: أخضر يعني يعمل بشكل جيد، برتقالي قد يشير لمشكلة أو نشاط غير طبيعي.', 2),
  (1, 'كيفية الاتصال بالسويتش للإدارة', 'يمكن الاتصال عبر منفذ الكونسول باستخدام كابل خاص أو عبر الشبكة باستخدام بروتوكولات مثل Telnet وSSH.', 3),
  (1, 'إعداد واجهة SVI', 'واجهة SVI هي واجهة افتراضية على VLAN1 تُستخدم لمنح السويتش عنوان IP حتى يمكن إدارته عن بُعد.', 4),
  -- Topic 2: إعداد المنافذ على السويتش
  (2, 'أوامر SHOW لفحص الإعدادات', 'الأوامر مثل show running-config وshow interfaces تسمح برؤية حالة المنافذ ومعرفة إن كانت مفعلة أو لا.', 1),
  -- Topic 3: اتصال آمن للإدارة
  (3, 'الاتصال عبر Telnet', 'Telnet يسمح بالوصول للجهاز عن بُعد لكنه غير آمن لأنه لا يستخدم التشفير.', 1),
  (3, 'الاتصال عبر SSH', 'SSH هو البديل الأكثر أمانًا حيث يشفر الاتصال ويحمي كلمات المرور والبيانات.', 2),
  (3, 'التحقق من دعم SSH', 'يجب التأكد أن الجهاز يدعم SSH من خلال إعداد مفاتيح تشفير (RSA Keys) وتفعيل الخدمة.', 3),
  (3, 'إعداد SSH', 'يتم تحديد اسم المضيف وكلمة المرور وتوليد مفاتيح التشفير لتفعيل بروتوكول SSH.', 4),
  (3, 'التحقق من إعداد SSH', 'بعد الإعداد يمكن فحص الخدمة باستخدام show ip ssh أو محاولة تسجيل دخول من جهاز آخر.', 5),
  -- Topic 4: الإعدادات الأساسية للراوتر
  (4, 'الإعدادات الأساسية', 'تشمل اسم الجهاز، كلمات المرور، والرسائل التحذيرية (Banner).', 1),
  (4, 'إعداد المنافذ', 'يتم تعيين عناوين IP للواجهات وتفعيلها باستخدام no shutdown.', 2),
  -- Topic 5: أوامر التحقق من حالة التشغيل
  (5, 'أوامر Show', 'أوامر مثل show ip interface brief وshow running-config تعرض ملخصًا عن حالة المنافذ والإعدادات.', 1),
  (5, 'أوامر إضافية', 'show ip route يُظهر جدول التوجيه وshow history يعرض الأوامر التي استُخدمت مؤخرًا.', 2)
) AS lesson_data(topic_num, title, content, order_index) 
ON section_topics.topic_num = lesson_data.topic_num;