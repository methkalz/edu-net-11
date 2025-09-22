-- أولاً: حذف جميع النسخ المكررة من الأقسام
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_sections 
)
DELETE FROM grade11_sections 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- ثانياً: حذف جميع النسخ المكررة من المواضيع
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY section_id, title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_topics 
)
DELETE FROM grade11_topics 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- ثالثاً: حذف جميع النسخ المكررة من الدروس
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY topic_id, title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_lessons 
)
DELETE FROM grade11_lessons 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);