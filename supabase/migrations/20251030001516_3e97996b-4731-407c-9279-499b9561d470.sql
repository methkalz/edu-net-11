-- ⚡ المرحلة 4أ: إضافة Indexes لتسريع الاستعلامات

-- Index على topic_id في جدول grade11_lessons
CREATE INDEX IF NOT EXISTS idx_grade11_lessons_topic_id 
  ON grade11_lessons(topic_id);

-- Index على section_id في جدول grade11_topics
CREATE INDEX IF NOT EXISTS idx_grade11_topics_section_id 
  ON grade11_topics(section_id);

-- Index على lesson_id في جدول grade11_lesson_media
CREATE INDEX IF NOT EXISTS idx_grade11_lesson_media_lesson_id 
  ON grade11_lesson_media(lesson_id);

-- Index إضافي على order_index لتسريع الترتيب
CREATE INDEX IF NOT EXISTS idx_grade11_lessons_order 
  ON grade11_lessons(topic_id, order_index);

CREATE INDEX IF NOT EXISTS idx_grade11_topics_order 
  ON grade11_topics(section_id, order_index);