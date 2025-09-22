-- إضافة دروس الموضوع الأول: مكوّنات الطبقة الفيزيائية
WITH topic1 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'مكوّنات الطبقة الفيزيائية (תכונות השכבה הפיזית)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t1.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic1 t1,
(VALUES 
  ('المعايير (תקנים)', 'المعايير هي قواعد دولية تحدد كيف يتم تصنيع الكابلات والموصلات والأجهزة. وجود هذه المعايير مثل Ethernet يضمن أن الأجهزة من شركات مختلفة تستطيع العمل معًا بسهولة ودون مشاكل توافقية.', 1),
  ('المكونات (רכיבים)', 'المكونات تشمل جميع العناصر الملموسة للشبكة مثل الكابلات النحاسية والألياف الضوئية والموصلات بالإضافة إلى أجهزة التوصيل مثل المحولات والموجهات. هذه العناصر تشكّل الطريق الذي تمر فيه البيانات.', 2),
  ('عرض النطاق (רוחב פס)', 'عرض النطاق هو كمية البيانات التي يمكن أن تمر في الثانية الواحدة عبر قناة الاتصال. يُقاس عادة بالميغابت في الثانية أو الغيغابت. كلما زاد عرض النطاق زادت سرعة الشبكة وقدرتها على نقل معلومات أكبر.', 3)
) AS lesson_data(title, content, order_index);

-- إضافة دروس الموضوع الثاني: كابلات نحاسية
WITH topic2 AS (
  SELECT t.id FROM grade11_topics t 
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'השכבה הפיזית – الطبقة الفيزيائية' AND t.title = 'كابلات نحاسية (כבלי נחושת)'
)
INSERT INTO grade11_lessons (topic_id, title, content, order_index)
SELECT 
  t2.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM topic2 t2,
(VALUES 
  ('خصائص الكابلات النحاسية', 'الكابلات النحاسية تنقل البيانات باستخدام إشارات كهربائية. هي الأكثر شيوعًا لأنها رخيصة وسهلة التركيب، لكنها تتأثر بالتشويش الكهرومغناطيسي مما قد يقلل من جودة الاتصال.', 1),
  ('أنواع الكابلات النحاسية (UTP, STP, COAX)', 'كابل UTP غير محمي ويُستخدم بكثرة في المنازل والمدارس. كابل STP يحتوي على طبقة حماية معدنية تقلل التشويش. كابل Coaxial يستخدم غالبًا في شبكات التلفاز أو الإنترنت القديمة.', 2)
) AS lesson_data(title, content, order_index);