-- إضافة قيود منع التكرار
-- قيد فريد لعناوين الأقسام
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade11_sections_title_unique 
ON grade11_sections(title);

-- قيد فريد للمواضيع (كل موضوع فريد داخل قسمه)
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade11_topics_section_title_unique 
ON grade11_topics(section_id, title);

-- قيد فريد للدروس (كل درس فريد داخل موضوعه)
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade11_lessons_topic_title_unique 
ON grade11_lessons(topic_id, title);