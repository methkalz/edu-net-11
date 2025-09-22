-- حذف الأقسام المكررة وترك فقط الأقسام الأولى من كل نوع
-- سنحتفظ بالأقسام التي لها created_at أقدم (أي الأقسام الأصلية)

-- حذف النسخ المكررة من القسم الخامس (שיטות מספר – طرق الترقيم)
DELETE FROM grade11_sections 
WHERE title = 'שיטות מספר – طرق الترقيم' 
AND id NOT IN (
  SELECT MIN(id) 
  FROM grade11_sections 
  WHERE title = 'שיטות מספר – طرق الترقيم'
);

-- حذف النسخ المكررة من القسم السادس (שכבת הקו Data Link Layer – طبقة ربط البيانات)
DELETE FROM grade11_sections 
WHERE title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات' 
AND id NOT IN (
  SELECT MIN(id) 
  FROM grade11_sections 
  WHERE title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات'
);

-- حذف النسخ المكررة من القسم السابع (מיתוג Ethernet – التحويل في الإيثرنت)
DELETE FROM grade11_sections 
WHERE title = 'מיתוג Ethernet – التحويل في الإيثرنت' 
AND id NOT IN (
  SELECT MIN(id) 
  FROM grade11_sections 
  WHERE title = 'מיתוג Ethernet – التحويل في الإيثرنت'
);