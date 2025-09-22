-- Insert Section 16: מושגים במיתוג - مفاهيم في عمل السويتش
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('מושגים במיתוג - مفاهيم في عمل السويتش', 'هذا القسم يوضح كيف يعمل السويتش داخل الشبكة، وكيف يتعامل مع العناوين والإطارات. سنتعرف على جدول MAC، عملية تمرير البيانات، بالإضافة إلى الفرق بين مجالات التصادم ومجالات البث.', 16);

-- Insert topics for Section 16
WITH section_16 AS (
  SELECT id FROM public.grade11_sections WHERE title = 'מושגים במיתוג - مفاهيم في عمل السويتش'
)
INSERT INTO public.grade11_topics (section_id, title, content, order_index) 
SELECT 
  section_16.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section_16, (VALUES 
  ('تمرير الإطارات (העברת המסגרות)', 'كيفية تعلم السويتش لعناوين MAC وتمرير البيانات', 1),
  ('مجالات التصادم (מרחבי התנגשות)', 'فهم مجالات التصادم وكيف يقللها السويتش', 2),
  ('مجالات البث (מרחבי שידור)', 'مجالات البث وتأثيرها على الشبكة وكيفية إدارتها', 3)
) AS topic_data(title, content, order_index);

-- Insert lessons for Section 16
WITH section_topics AS (
  SELECT t.id, t.title, ROW_NUMBER() OVER (ORDER BY t.order_index) as topic_num
  FROM grade11_topics t
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'מושגים במיתוג - مفاهيم في عمل السويتش'
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
  -- Topic 1: تمرير الإطارات
  (1, 'جدول MAC في السويتش', 'السويتش يحتفظ بجدول MAC يربط كل عنوان MAC بالمنفذ المتصل به. هذا الجدول يسمح بتوجيه الإطارات مباشرة للوجهة الصحيحة بدلًا من إرسالها لجميع الأجهزة.', 1),
  (1, 'عملية التعلم وتمرير البيانات', 'عندما يستقبل السويتش إطارًا، يسجل عنوان MAC للمصدر مع المنفذ. وعندما يستقبل إطارًا للوجهة نفسها لاحقًا، يرسله مباشرة عبر المنفذ المناسب. هذا يقلل الازدحام ويحسّن الكفاءة.', 2),
  -- Topic 2: مجالات التصادم
  (2, 'تعريف مجال التصادم', 'هو جزء من الشبكة يمكن أن يحدث فيه تصادم إذا حاول أكثر من جهاز الإرسال في نفس الوقت. كان شائعًا في الأجهزة القديمة مثل HUB.', 1),
  (2, 'السويتش وتقليل التصادم', 'السويتش يفصل الشبكة بحيث يصبح كل منفذ مجال تصادم مستقل. هذا يمنع التصادمات ويزيد سرعة الشبكة وكفاءتها.', 2),
  -- Topic 3: مجالات البث
  (3, 'تعريف مجال البث', 'مجال البث هو منطقة في الشبكة تصل فيها رسائل البث (Broadcast) إلى جميع الأجهزة، مثل رسائل ARP.', 1),
  (3, 'تأثير البث على الشبكة', 'إذا زادت رسائل البث، تضطر كل الأجهزة لمعالجتها، مما قد يبطئ الشبكة ويزيد الضغط على الأجهزة.', 2),
  (3, 'السويتش ومجالات البث', 'السويتش بشكل افتراضي لا يفصل مجالات البث، فجميع منافذه تكون في نفس المجال. لذلك أي رسالة بث تصل إلى جميع الأجهزة المتصلة به.', 3),
  (3, 'VLAN وتقسيم مجالات البث', 'باستخدام VLAN يمكن تقسيم الشبكة الكبيرة إلى عدة مجالات بث أصغر. هذا يعزز الأمان ويقلل الازدحام ويسهّل إدارة الشبكة.', 4)
) AS lesson_data(topic_num, title, content, order_index) 
ON section_topics.topic_num = lesson_data.topic_num;