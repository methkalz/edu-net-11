-- إعادة ترتيب دروس الألعاب حسب التسلسل المنطقي للمحتوى النصي

-- تحديث order_index لدروس الألعاب حسب التسلسل المنطقي
-- المستوى الأول: أساسيات الاتصال
UPDATE grade11_lessons 
SET order_index = 1 
WHERE id = 'eadf3ef5-2bf4-4a45-8e91-ad009a948f27' AND title = 'مضيف (Host)';

UPDATE grade11_lessons 
SET order_index = 2
WHERE id = '4aaaace7-925f-45f7-92c5-d16117e33492' AND title = 'شبكة عميل/خادم (Server-Client Network)';

UPDATE grade11_lessons 
SET order_index = 3
WHERE id = '9a9bc0f3-1030-4f58-9109-8453b7ae7ce7' AND title = 'شبكة نظير إلى نظير (Peer-to-Peer)';

-- الدروس المتعلقة بالبروتوكولات والعناوين
UPDATE grade11_lessons 
SET order_index = 4
WHERE id = '9dbce961-8cc6-4829-89db-d105963ec49d' AND title = 'بروتوكولات IPv4 وIPv6';

UPDATE grade11_lessons 
SET order_index = 5
WHERE id = '6500f346-b501-4b7e-8b35-7983271f77cd' AND title = 'الـ Header في IPv4';

UPDATE grade11_lessons 
SET order_index = 6
WHERE id = '96433abd-ba20-4472-9b26-4727f9993cf4' AND title = 'عنوان MAC';

-- الدروس المتعلقة بـ ARP (تأتي لاحقاً في التسلسل المنطقي)
UPDATE grade11_lessons 
SET order_index = 7
WHERE id = 'a8305041-cc47-4093-a9d4-d5fd4bc96648' AND title = 'نظرة عامة على ARP';

UPDATE grade11_lessons 
SET order_index = 8
WHERE id = '3aaee068-6c0c-411d-bf96-b29b674b820c' AND title = 'وظيفة ARP';

UPDATE grade11_lessons 
SET order_index = 9
WHERE id = '4e92b0d0-7a46-4b28-a718-02856e282a5d' AND title = 'عندما يكون المصدر والوجهة في نفس الشبكة';

UPDATE grade11_lessons 
SET order_index = 10
WHERE id = 'e60f2d24-2407-4f74-97b3-52af27fd514d' AND title = 'عندما يكون المصدر والوجهة في شبكتين مختلفتين';

-- الدروس المتعلقة بالشبكات والأجهزة
UPDATE grade11_lessons 
SET order_index = 11
WHERE id = 'aa5334b5-99fa-40f9-b821-0c4c5af07629' AND title = 'Hostname';

UPDATE grade11_lessons 
SET order_index = 12
WHERE id = '46a7137f-365f-4028-82a2-77e579018474' AND title = 'سرعات الإيثرنت';

UPDATE grade11_lessons 
SET order_index = 13
WHERE id = '658478a9-6a63-4bc7-9538-9b31453bd982' AND title = 'رسالة DNS';

-- إضافة تعليق توضيحي للنظام
COMMENT ON COLUMN grade11_lessons.order_index IS 'ترتيب الدروس حسب التسلسل المنطقي للمحتوى النصي - تم تحديثه في 2025-09-03';