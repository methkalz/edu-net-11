-- حذف الأقسام المكررة باستخدام طريقة مختلفة
-- سنحذف الأقسام المكررة بناءً على created_at (نحتفظ بالأقدم)

-- حذف النسخ المكررة من القسم الخامس
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_sections 
  WHERE title = 'שיטות מספר – طرق الترقيم'
)
DELETE FROM grade11_sections 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- حذف النسخ المكررة من القسم السادس
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_sections 
  WHERE title = 'שכבת הקו Data Link Layer – طبقة ربط البيانات'
)
DELETE FROM grade11_sections 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- حذف النسخ المكررة من القسم السابع
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_sections 
  WHERE title = 'מיתוג Ethernet – التحويل في الإيثرنت'
)
DELETE FROM grade11_sections 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);