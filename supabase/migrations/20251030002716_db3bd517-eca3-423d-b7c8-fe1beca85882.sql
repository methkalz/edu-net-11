-- إضافة عمود lessons_count لتحسين الأداء
ALTER TABLE grade11_topics ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 0;

-- تحديث القيم الحالية
UPDATE grade11_topics t
SET lessons_count = (
  SELECT COUNT(*) FROM grade11_lessons l WHERE l.topic_id = t.id
);

-- إنشاء دالة لتحديث lessons_count تلقائياً
CREATE OR REPLACE FUNCTION update_grade11_topic_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE grade11_topics 
    SET lessons_count = GREATEST(0, lessons_count - 1)
    WHERE id = OLD.topic_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE grade11_topics 
    SET lessons_count = lessons_count + 1
    WHERE id = NEW.topic_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger على grade11_lessons
DROP TRIGGER IF EXISTS update_grade11_lessons_count_trigger ON grade11_lessons;
CREATE TRIGGER update_grade11_lessons_count_trigger
AFTER INSERT OR DELETE ON grade11_lessons
FOR EACH ROW EXECUTE FUNCTION update_grade11_topic_lessons_count();