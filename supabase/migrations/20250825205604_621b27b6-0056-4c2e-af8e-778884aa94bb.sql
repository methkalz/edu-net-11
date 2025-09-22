-- حذف القسم المكرر الفارغ
DELETE FROM grade11_sections 
WHERE id = '3a6dbc6c-72b5-4380-914f-b957fd5ff07c' 
AND title = 'البروتوكولات والنماذج (פרוטוקולים ומודולים)';

-- التأكد من ترقيم الأقسام بشكل صحيح
UPDATE grade11_sections SET order_index = 1 
WHERE title = 'יסודות התקשורת – أساسيات الاتصال';

UPDATE grade11_sections SET order_index = 2 
WHERE title = 'מערכת הפעלה של נתב / מתג – نظام تشغيل الراوتر/السويتش';

UPDATE grade11_sections SET order_index = 3 
WHERE title = 'البروتوكولات والنماذج (פרוטוקולים ומודולים)' 
AND id = 'b49b4b78-a88c-484a-9638-bd7b948b828b';