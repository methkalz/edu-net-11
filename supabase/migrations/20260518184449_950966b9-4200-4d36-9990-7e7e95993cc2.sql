
CREATE TABLE public.grade10_ka_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grade10_ka_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.grade10_ka_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grade10_ka_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.grade10_ka_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grade10_ka_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID,
  topic_id UUID,
  lesson_id UUID NOT NULL REFERENCES public.grade10_ka_lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  points INTEGER NOT NULL DEFAULT 10,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g10ka_topics_section ON public.grade10_ka_topics(section_id, order_index);
CREATE INDEX idx_g10ka_lessons_topic ON public.grade10_ka_lessons(topic_id, order_index);
CREATE INDEX idx_g10ka_questions_lesson ON public.grade10_ka_questions(lesson_id);

CREATE TABLE public.grade10_ka_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE public.grade10_ka_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade10_ka_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_ka_topics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_ka_lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_ka_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_ka_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_ka_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "g10ka_sections_read" ON public.grade10_ka_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "g10ka_sections_write" ON public.grade10_ka_sections FOR ALL TO authenticated
  USING (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']))
  WITH CHECK (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']));

CREATE POLICY "g10ka_topics_read" ON public.grade10_ka_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "g10ka_topics_write" ON public.grade10_ka_topics FOR ALL TO authenticated
  USING (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']))
  WITH CHECK (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']));

CREATE POLICY "g10ka_lessons_read" ON public.grade10_ka_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "g10ka_lessons_write" ON public.grade10_ka_lessons FOR ALL TO authenticated
  USING (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']))
  WITH CHECK (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']));

CREATE POLICY "g10ka_questions_read" ON public.grade10_ka_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "g10ka_questions_write" ON public.grade10_ka_questions FOR ALL TO authenticated
  USING (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']))
  WITH CHECK (get_user_role()::text = ANY (ARRAY['superadmin','school_admin']));

CREATE POLICY "g10ka_progress_select_own" ON public.grade10_ka_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "g10ka_progress_insert_own" ON public.grade10_ka_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "g10ka_progress_update_own" ON public.grade10_ka_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "g10ka_achievements_select_own" ON public.grade10_ka_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "g10ka_achievements_insert_own" ON public.grade10_ka_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_g10ka_sections_updated  BEFORE UPDATE ON public.grade10_ka_sections  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_g10ka_topics_updated    BEFORE UPDATE ON public.grade10_ka_topics    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_g10ka_lessons_updated   BEFORE UPDATE ON public.grade10_ka_lessons   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_g10ka_questions_updated BEFORE UPDATE ON public.grade10_ka_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.grade10_ka_sections (id, title, description, order_index, created_by, created_at, updated_at)
SELECT id, title, description, order_index, created_by, created_at, updated_at
FROM public.grade11_sections;

INSERT INTO public.grade10_ka_topics (id, section_id, title, content, order_index, created_at, updated_at)
SELECT id, section_id, title, content, order_index, created_at, updated_at
FROM public.grade11_topics;

INSERT INTO public.grade10_ka_lessons (id, topic_id, title, content, order_index, is_active, created_at, updated_at)
SELECT
  l.id,
  l.topic_id,
  CASE
    WHEN TRIM(l.title) IN ('مقدمة','مقدمه','مقدمه افاتار','مقدمة افاتار','مقدمة أفاتار','مقدمه افتار','مقدمة افتار')
      THEN 'مقدمة — ' || t.title
    ELSE l.title
  END,
  l.content,
  l.order_index,
  l.is_active,
  l.created_at,
  l.updated_at
FROM public.grade11_lessons l
JOIN public.grade11_topics t ON t.id = l.topic_id
WHERE TRIM(l.title) NOT ILIKE 'حذف%';

INSERT INTO public.grade10_ka_questions
  (id, section_id, topic_id, lesson_id, question_text, question_type, choices, correct_answer, explanation, difficulty_level, points, created_by, created_at)
SELECT
  q.id,
  COALESCE(q.section_id, t.section_id),
  COALESCE(q.topic_id, l.topic_id),
  q.lesson_id,
  q.question_text,
  q.question_type,
  q.choices,
  q.correct_answer,
  q.explanation,
  q.difficulty_level,
  q.points,
  q.created_by,
  q.created_at
FROM public.grade11_game_questions q
JOIN public.grade10_ka_lessons l ON l.id = q.lesson_id
JOIN public.grade10_ka_topics  t ON t.id = l.topic_id;
