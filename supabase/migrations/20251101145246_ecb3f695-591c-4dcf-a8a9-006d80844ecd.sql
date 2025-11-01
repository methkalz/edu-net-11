-- إنشاء جدول جديد لتتبع التقدم على مستوى المواضيع بدلاً من الدروس
CREATE TABLE IF NOT EXISTS grade11_topic_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES grade11_topics(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  max_score INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  unlocked BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  best_time INTEGER, -- بالثواني
  last_attempt_at TIMESTAMPTZ,
  mistakes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- تمكين RLS
ALTER TABLE grade11_topic_progress ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "اللاعبون يمكنهم إنشاء تقدمهم"
  ON grade11_topic_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "اللاعبون يمكنهم رؤية تقدمهم"
  ON grade11_topic_progress
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "اللاعبون يمكنهم تحديث تقدمهم"
  ON grade11_topic_progress
  FOR UPDATE
  USING (user_id = auth.uid());

-- تحديث الـ updated_at تلقائياً
CREATE TRIGGER update_grade11_topic_progress_updated_at
  BEFORE UPDATE ON grade11_topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- فهرسة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_topic 
  ON grade11_topic_progress(user_id, topic_id);

CREATE INDEX IF NOT EXISTS idx_topic_progress_user 
  ON grade11_topic_progress(user_id);

-- إضافة تعليق للتوثيق
COMMENT ON TABLE grade11_topic_progress IS 'يتتبع تقدم الطلاب على مستوى المواضيع (Topics) بدلاً من الدروس (Lessons)';