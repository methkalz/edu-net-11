-- إضافة القسم الرابع: השכבה הפיזית – الطبقة الفيزيائية
INSERT INTO grade11_sections (title, description, order_index, created_by) VALUES 
('השכבה הפיזית – الطبقة الفيزيائية', 'هذا القسم يركّز على البنية الملموسة للشبكات. هنا نتعرف على الكابلات والموصلات وأنواع الإشارات الفيزيائية مثل الكهربائية والضوئية واللاسلكية. الهدف أن يفهم الطالب كيف تنتقل البيانات فعليًا فيزيائيًا من جهاز إلى آخر.', 4, auth.uid());

-- الحصول على معرف القسم الجديد
WITH new_section AS (
  SELECT id FROM grade11_sections WHERE title = 'השכבה הפיזית – الطبقة الفيزيائية'
)

-- إضافة الموضوعات
INSERT INTO grade11_topics (section_id, title, content, order_index) 
SELECT 
  ns.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM new_section ns,
(VALUES 
  ('مكوّنات الطبقة الفيزيائية (תכונות השכבה הפיזית)', '', 1),
  ('كابلات نحاسية (כבלי נחושת)', '', 2),
  ('كابلات من نوع UTP (כבלים מסוג UTP)', '', 3),
  ('كابلات ألياف ضوئية (כבל אופטי)', '', 4),
  ('الموصلات (מחברים)', '', 5),
  ('المقارنة بين الألياف الضوئية والنحاس (השוואה בין כבל אופטי לכבל נחושת)', '', 6),
  ('الوسائط اللاسلكية (מדיה אלחוטית)', '', 7)
) AS topic_data(title, content, order_index);