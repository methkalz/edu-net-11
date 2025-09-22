-- حذف النسخ المكررة من القسم الثامن
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY title 
    ORDER BY created_at ASC
  ) as rn
  FROM grade11_sections 
  WHERE title = 'שכבת הרשת - طبقة الشبكة (Network Layer)'
)
DELETE FROM grade11_sections 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- إنشاء فهرس فريد لمنع تكرار العناوين في المستقبل
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade11_sections_title_unique 
ON grade11_sections(title);

-- إنشاء فهرس فريد للمواضيع لمنع التكرار
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade11_topics_section_title_unique 
ON grade11_topics(section_id, title);

-- إنشاء فهرس فريد للدروس لمنع التكرار  
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade11_lessons_topic_title_unique 
ON grade11_lessons(topic_id, title);