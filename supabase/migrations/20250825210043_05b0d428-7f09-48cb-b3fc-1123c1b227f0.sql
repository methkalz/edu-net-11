-- إضافة درس الموضوع الخامس: الموصلات
WITH topic5 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'الموصلات (מחברים)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t5.id,
  'الموصلات في الكابلات',
  'الموصلات هي القطع المعدنية أو البلاستيكية التي تربط الكابلات بالأجهزة. من الأمثلة الشائعة موصل RJ45 لكابلات UTP وموصلات LC أو SC للألياف الضوئية. وظيفتها الأساسية ضمان انتقال الإشارة بشكل صحيح ومستقر.',
  1
FROM topic5;

-- إضافة درس الموضوع السادس: المقارنة بين الألياف الضوئية والنحاس
WITH topic6 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'المقارنة بين الألياف الضوئية والنحاس (השוואה בין כבל אופטי לכבל נחושת)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t6.id,
  'الفرق بين الألياف الضوئية والنحاس',
  'الألياف الضوئية أسرع بكثير، تدعم مسافات أطول، ولا تتأثر بالتشويش. لكنها أغلى ثمنًا وأكثر صعوبة في التركيب. الكابلات النحاسية أرخص وأسهل لكنها محدودة من حيث السرعة والمسافة.',
  1
FROM topic6;

-- إضافة دروس الموضوع السابع: الوسائط اللاسلكية
WITH topic7 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'الوسائط اللاسلكية (מדיה אלחוטית)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t7.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic7 t7,
(VALUES 
  ('خصائص الوسائط اللاسلكية', 'الوسائط اللاسلكية تستخدم موجات الراديو بدلاً من الكابلات لنقل البيانات. هي مريحة وسهلة التركيب وتسمح بحرية الحركة، لكنها أكثر عرضة للتداخل أو الاختراق مقارنة بالكابلات.', 1),
  ('أنواع الوسائط اللاسلكية', 'Wi-Fi يُستخدم للاتصال بالإنترنت في البيوت والمدارس. Bluetooth مخصص للاتصال بين الأجهزة القريبة مثل سماعات الرأس. WiMAX يُستخدم لنقل البيانات لمسافات أوسع ويُعتبر بديلًا للاتصال السلكي في بعض المناطق.', 2)
) AS lesson_data(title, content, order_index);