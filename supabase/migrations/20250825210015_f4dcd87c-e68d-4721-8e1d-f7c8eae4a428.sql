-- إضافة دروس الموضوع الثالث: كابلات من نوع UTP
WITH topic3 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'كابلات من نوع UTP (כבלים מסוג UTP)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t3.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic3 t3,
(VALUES 
  ('خصائص كابل UTP', 'كابل UTP أو Unshielded Twisted Pair يتكون من أزواج أسلاك ملتفة معًا. هذا الالتفاف يقلل التشويش ويجعل الكابل مناسبًا للشبكات المحلية LAN.', 1),
  ('أنواع الكابلات والمعايير والتوصيلات', 'هناك نوعان أساسيان من الكابلات: الكابل المستقيم الذي يُستخدم عند التوصيل بجهاز وسيط مثل السويتش، والكابل المعكوس الذي يُستخدم عند توصيل جهازين مباشرة ببعضهما.', 2),
  ('كابل مستقيم مقابل كابل معكوس', 'الكابل المستقيم يوصل أجهزة مختلفة مثل حاسوب مع سويتش. أما الكابل المعكوس فيُستخدم لتوصيل جهازين متشابهين مثل حاسوب مع حاسوب.', 3)
) AS lesson_data(title, content, order_index);

-- إضافة دروس الموضوع الرابع: كابلات ألياف ضوئية
WITH topic4 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'كابلات ألياف ضوئية (כבל אופטי)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t4.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic4 t4,
(VALUES 
  ('خصائص كابل الألياف الضوئية', 'الألياف الضوئية تنقل البيانات عبر إشارات ضوئية داخل ألياف زجاجية دقيقة. تمتاز بسرعة عالية جدًا وقدرتها على تغطية مسافات طويلة دون فقدان الإشارة.', 1),
  ('أنواع الألياف الضوئية', 'هناك نوع Single-Mode مخصص للمسافات الطويلة جدًا يصل إلى مئات الكيلومترات. وهناك نوع Multi-Mode يُستخدم للمسافات القصيرة مثل داخل المباني أو الجامعات.', 2),
  ('متى نستخدم الألياف الضوئية', 'الألياف الضوئية تُستخدم عندما نحتاج سرعة عالية جدًا أو عندما يكون الاتصال لمسافات بعيدة مثل ربط المدن أو مراكز البيانات الكبيرة.', 3)
) AS lesson_data(title, content, order_index);