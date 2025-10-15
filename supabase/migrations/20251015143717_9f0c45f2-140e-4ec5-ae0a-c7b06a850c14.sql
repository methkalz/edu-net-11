-- ============================================================================
-- نسخ محتوى "أساسيات الاتصال" من الصف الحادي عشر إلى الصف العاشر
-- Migration نهائي مُصحح بالكامل بناءً على البنية الفعلية للجداول
-- ============================================================================

-- المرحلة 1: حذف المحتوى القديم من الصف العاشر
-- ============================================================================

-- حذف الملفات المرفقة بالدروس
DELETE FROM grade10_lesson_media 
WHERE lesson_id IN (
  SELECT l.id FROM grade10_lessons l
  JOIN grade10_topics t ON t.id = l.topic_id
  JOIN grade10_sections s ON s.id = t.section_id
  WHERE s.title LIKE '%יסודות התקשורת%' OR s.title LIKE '%أساسيات الاتصال%'
);

-- حذف الدروس
DELETE FROM grade10_lessons 
WHERE topic_id IN (
  SELECT t.id FROM grade10_topics t
  JOIN grade10_sections s ON s.id = t.section_id
  WHERE s.title LIKE '%יסודות התקשורת%' OR s.title LIKE '%أساسيات الاتصال%'
);

-- حذف المواضيع
DELETE FROM grade10_topics 
WHERE section_id IN (
  SELECT id FROM grade10_sections 
  WHERE title LIKE '%יסודות התקשורת%' OR title LIKE '%أساسيات الاتصال%'
);

-- المرحلة 2: نسخ المحتوى الجديد من الصف الحادي عشر
-- ============================================================================

-- 2.1: نسخ المواضيع (topics)
-- grade10_topics: id, section_id, title, content, order_index, created_at, updated_at
-- grade11_topics: id, section_id, title, content, order_index, created_at, updated_at
INSERT INTO grade10_topics (section_id, title, content, order_index, created_at, updated_at)
SELECT 
  (SELECT id FROM grade10_sections WHERE title LIKE '%יסודות התקשורת%' OR title LIKE '%أساسيات الاتصال%' LIMIT 1) as section_id,
  t11.title,
  t11.content,
  t11.order_index,
  now() as created_at,
  now() as updated_at
FROM grade11_topics t11
WHERE t11.section_id = (
  SELECT id FROM grade11_sections 
  WHERE title LIKE '%יסודות התקשורת%' OR title LIKE '%أساسيات الاتصال%' 
  LIMIT 1
)
ORDER BY t11.order_index;

-- 2.2: نسخ الدروس (lessons) مع mapping للـ topic_ids
-- grade10_lessons: id, topic_id, title, content, order_index, is_active, created_at, updated_at
-- grade11_lessons: id, topic_id, title, content, order_index, created_at, updated_at, is_active
INSERT INTO grade10_lessons (topic_id, title, content, order_index, is_active, created_at, updated_at)
SELECT 
  t10.id as topic_id,
  l11.title,
  l11.content,
  l11.order_index,
  COALESCE(l11.is_active, true) as is_active,
  now() as created_at,
  now() as updated_at
FROM grade11_lessons l11
JOIN grade11_topics t11 ON t11.id = l11.topic_id
JOIN grade10_topics t10 ON t10.title = t11.title AND t10.order_index = t11.order_index
WHERE t11.section_id = (
  SELECT id FROM grade11_sections 
  WHERE title LIKE '%יסודות התקשורת%' OR title LIKE '%أساسيات الاتصال%' 
  LIMIT 1
)
ORDER BY l11.order_index;

-- 2.3: نسخ الملفات المرفقة (lesson_media) مع mapping للـ lesson_ids
-- grade10_lesson_media: id, lesson_id, media_type, file_name, file_path, metadata, order_index, created_at
-- grade11_lesson_media: id, lesson_id, media_type, file_path, file_name, metadata, order_index, created_at
INSERT INTO grade10_lesson_media (lesson_id, media_type, file_path, file_name, metadata, order_index, created_at)
SELECT 
  l10.id as lesson_id,
  m11.media_type,
  m11.file_path,
  m11.file_name,
  COALESCE(m11.metadata, '{}'::jsonb) as metadata,
  m11.order_index,
  now() as created_at
FROM grade11_lesson_media m11
JOIN grade11_lessons l11 ON l11.id = m11.lesson_id
JOIN grade11_topics t11 ON t11.id = l11.topic_id
JOIN grade10_topics t10 ON t10.title = t11.title AND t10.order_index = t11.order_index
JOIN grade10_lessons l10 ON l10.topic_id = t10.id AND l10.title = l11.title AND l10.order_index = l11.order_index
WHERE t11.section_id = (
  SELECT id FROM grade11_sections 
  WHERE title LIKE '%יסודות התקשורת%' OR title LIKE '%أساسيات الاتصال%' 
  LIMIT 1
)
ORDER BY m11.order_index;

-- المرحلة 3: تحديث وصف القسم في الصف العاشر ليطابق الصف الحادي عشر
-- ============================================================================
-- grade10_sections: id, title, description, order_index, created_at, updated_at, created_by
-- grade11_sections: id, title, description, order_index, created_by, created_at, updated_at
UPDATE grade10_sections 
SET 
  description = (
    SELECT description FROM grade11_sections 
    WHERE title LIKE '%יסודות התקשורת%' OR title LIKE '%أساسيات الاتصال%' 
    LIMIT 1
  ),
  updated_at = now()
WHERE title LIKE '%יסودות התקשורת%' OR title LIKE '%أساسيات الاتصال%';
