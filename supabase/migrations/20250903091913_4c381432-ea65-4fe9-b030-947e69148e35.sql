-- إصلاح ترتيب الدروس وإصلاح الأسئلة المعطوبة

-- ☠️ المرحلة 1: إصلاح ترتيب البطاقات الأساسية
UPDATE grade11_lessons SET order_index = 1 WHERE title LIKE '%مضيف%' OR title LIKE '%Host%';
UPDATE grade11_lessons SET order_index = 2 WHERE title LIKE '%نظير إلى نظير%' OR title LIKE '%Peer-to-Peer%';
UPDATE grade11_lessons SET order_index = 3 WHERE title LIKE '%هدف العناوين%' OR title LIKE '%العناوين في الشبكة%';
UPDATE grade11_lessons SET order_index = 4 WHERE title LIKE '%أساس الاتصال%' OR title LIKE '%المرسل والمستقبل%';
UPDATE grade11_lessons SET order_index = 5 WHERE title LIKE '%الشبكة والجزء المضيف%';
UPDATE grade11_lessons SET order_index = 6 WHERE title LIKE '%الإنترنت%';
UPDATE grade11_lessons SET order_index = 7 WHERE title LIKE '%TCP%';
UPDATE grade11_lessons SET order_index = 8 WHERE title LIKE '%بروتوكول الإيثرنت%';
UPDATE grade11_lessons SET order_index = 9 WHERE title LIKE '%DNS%';
UPDATE grade11_lessons SET order_index = 10 WHERE title LIKE '%DHCP%';

-- المرحلة 2: حذف الأسئلة المعطوبة لـ "هدف العناوين في الشبكة"
DELETE FROM grade11_game_questions 
WHERE lesson_id = (SELECT id FROM grade11_lessons WHERE title LIKE '%هدف العناوين%' LIMIT 1);

-- المرحلة 3: إضافة أسئلة صحيحة ومحددة لـ "هدف العناوين في الشبكة"
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, points, difficulty_level)
VALUES 
-- السؤال الأول: الغرض الأساسي من عناوين IP
((SELECT id FROM grade11_lessons WHERE title LIKE '%هدف العناوين%' LIMIT 1),
 'ما هو الغرض الأساسي من عناوين IP في الشبكة؟',
 'multiple_choice',
 '[{"id": "A", "text": "تحديد مصدر ووجهة البيانات"}, {"id": "B", "text": "تشفير البيانات المرسلة"}, {"id": "C", "text": "ضغط الملفات الكبيرة"}, {"id": "D", "text": "تسريع الاتصال"}]',
 'A',
 10,
 'easy'),

-- السؤال الثاني: تعارض العناوين
((SELECT id FROM grade11_lessons WHERE title LIKE '%هدف العناوين%' LIMIT 1),
 'ماذا يحدث إذا كان لجهازين نفس عنوان IP في الشبكة؟',
 'multiple_choice',
 '[{"id": "A", "text": "تعارض في الشبكة وفشل الاتصال"}, {"id": "B", "text": "تسريع الاتصال بينهما"}, {"id": "C", "text": "لا يحدث أي مشكلة"}, {"id": "D", "text": "توفير في استخدام الذاكرة"}]',
 'A',
 10,
 'medium'),

-- السؤال الثالث: أجزاء عنوان IP
((SELECT id FROM grade11_lessons WHERE title LIKE '%هدف العناوين%' LIMIT 1),
 'من كم جزء يتكون عنوان IPv4؟',
 'multiple_choice',
 '[{"id": "A", "text": "جزأين: الشبكة والمضيف"}, {"id": "B", "text": "ثلاثة أجزاء: البروتوكول والشبكة والمضيف"}, {"id": "C", "text": "جزء واحد فقط"}, {"id": "D", "text": "أربعة أجزاء منفصلة تماماً"}]',
 'A',
 10,
 'medium'),

-- السؤال الرابع: عنوان الشبكة المحلية
((SELECT id FROM grade11_lessons WHERE title LIKE '%هدف العناوين%' LIMIT 1),
 'أي من العناوين التالية يُستخدم للشبكة المحلية؟',
 'multiple_choice',
 '[{"id": "A", "text": "192.168.1.1"}, {"id": "B", "text": "8.8.8.8"}, {"id": "C", "text": "173.194.72.100"}, {"id": "D", "text": "74.125.224.72"}]',
 'A',
 10,
 'easy'),

-- السؤال الخامس: أهمية Subnet Mask
((SELECT id FROM grade11_lessons WHERE title LIKE '%هدف العناوين%' LIMIT 1),
 'ما دور Subnet Mask في عناوين الشبكة؟',
 'multiple_choice',
 '[{"id": "A", "text": "تحديد حدود الشبكة المحلية"}, {"id": "B", "text": "تشفير البيانات"}, {"id": "C", "text": "تسريع النقل"}, {"id": "D", "text": "حفظ كلمات المرور"}]',
 'A',
 10,
 'medium');