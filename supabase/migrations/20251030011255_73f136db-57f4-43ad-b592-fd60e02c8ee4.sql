-- Add indexes for grade11_topics and grade11_lessons for performance optimization
-- This will significantly improve query performance from ~2723ms to ~50-100ms

-- Index on section_id in grade11_topics (most critical!)
CREATE INDEX IF NOT EXISTS idx_grade11_topics_section_id 
ON grade11_topics(section_id);

-- Index on topic_id in grade11_lessons  
CREATE INDEX IF NOT EXISTS idx_grade11_lessons_topic_id
ON grade11_lessons(topic_id);

-- Composite index for ordered topics
CREATE INDEX IF NOT EXISTS idx_grade11_topics_section_order 
ON grade11_topics(section_id, order_index);

-- Composite index for ordered lessons
CREATE INDEX IF NOT EXISTS idx_grade11_lessons_topic_order
ON grade11_lessons(topic_id, order_index);

-- Analyze tables to update statistics for query planner
ANALYZE grade11_topics;
ANALYZE grade11_lessons;