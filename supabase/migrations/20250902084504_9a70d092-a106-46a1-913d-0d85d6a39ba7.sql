-- المرحلة الأولى: تطوير نظام اللعبة التعليمية الذكي

-- إضافة جدول تكوين صعوبة الدروس
CREATE TABLE public.grade11_lesson_difficulty_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.grade11_lessons(id) ON DELETE CASCADE,
  lesson_level TEXT NOT NULL CHECK (lesson_level IN ('basic', 'intermediate', 'advanced')),
  questions_per_session INTEGER NOT NULL DEFAULT 5,
  easy_percentage INTEGER NOT NULL DEFAULT 50,
  medium_percentage INTEGER NOT NULL DEFAULT 40, 
  hard_percentage INTEGER NOT NULL DEFAULT 10,
  min_score_to_pass INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_percentages CHECK (easy_percentage + medium_percentage + hard_percentage = 100)
);

-- إضافة جدول قوالب الأسئلة الذكية
CREATE TABLE public.grade11_question_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'drag_drop', 'scenario_based', 'code_analysis')),
  template_pattern TEXT NOT NULL, -- نمط القالب
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  subject_category TEXT NOT NULL, -- فئة الموضوع (networks, protocols, security, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة جدول محلل المحتوى (لاستخراج المفاهيم من الدروس)
CREATE TABLE public.grade11_content_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.grade11_lessons(id) ON DELETE CASCADE,
  concept_text TEXT NOT NULL,
  concept_type TEXT NOT NULL CHECK (concept_type IN ('definition', 'process', 'example', 'comparison', 'advantage', 'disadvantage')),
  importance_level INTEGER NOT NULL DEFAULT 1 CHECK (importance_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lesson_id, concept_text)
);

-- إضافة جدول الأسئلة المولّدة تلقائياً
CREATE TABLE public.grade11_generated_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.grade11_lessons(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.grade11_content_concepts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.grade11_question_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'drag_drop', 'scenario_based', 'code_analysis')),
  choices JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL DEFAULT 10,
  time_limit INTEGER DEFAULT 60,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة إعدادات النقاط المتقدمة
CREATE TABLE public.grade11_scoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_name TEXT NOT NULL UNIQUE,
  base_points INTEGER NOT NULL DEFAULT 10,
  time_bonus_multiplier DECIMAL(3,2) DEFAULT 1.5,
  accuracy_multiplier DECIMAL(3,2) DEFAULT 2.0,
  streak_bonus_points INTEGER DEFAULT 5,
  difficulty_multipliers JSONB NOT NULL DEFAULT '{"easy": 1.0, "medium": 1.5, "hard": 2.0}',
  perfect_score_bonus INTEGER DEFAULT 20,
  speed_completion_threshold INTEGER DEFAULT 120, -- ثواني
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة جدول إحصائيات أداء اللاعبين المتقدمة
CREATE TABLE public.grade11_player_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.grade11_lessons(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}',
  learning_pattern JSONB DEFAULT '{}', -- أنماط التعلم
  weak_areas JSONB DEFAULT '[]', -- المناطق الضعيفة
  strong_areas JSONB DEFAULT '[]', -- المناطق القوية
  preferred_question_types JSONB DEFAULT '[]',
  optimal_session_length INTEGER, -- بالدقائق
  recommendation_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- إضافة تريغرز لتحديث التواريخ
CREATE TRIGGER update_grade11_lesson_difficulty_config_updated_at
  BEFORE UPDATE ON public.grade11_lesson_difficulty_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade11_question_templates_updated_at
  BEFORE UPDATE ON public.grade11_question_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade11_generated_questions_updated_at
  BEFORE UPDATE ON public.grade11_generated_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade11_scoring_config_updated_at
  BEFORE UPDATE ON public.grade11_scoring_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade11_player_analytics_updated_at
  BEFORE UPDATE ON public.grade11_player_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إدراج بيانات أولية للتكوين
INSERT INTO public.grade11_scoring_config (config_name, base_points, time_bonus_multiplier, accuracy_multiplier, streak_bonus_points, difficulty_multipliers, perfect_score_bonus, speed_completion_threshold)
VALUES ('default', 10, 1.5, 2.0, 5, '{"easy": 1.0, "medium": 1.5, "hard": 2.0}', 20, 120);

-- إدراج قوالب الأسئلة الأساسية
INSERT INTO public.grade11_question_templates (template_name, question_type, template_pattern, difficulty_level, subject_category) VALUES
('basic_definition', 'multiple_choice', 'ما هو {CONCEPT}؟', 'easy', 'definitions'),
('function_question', 'multiple_choice', 'ما وظيفة {CONCEPT}؟', 'easy', 'functions'),
('advantage_question', 'multiple_choice', 'ما ميزة {CONCEPT}؟', 'medium', 'advantages'),
('disadvantage_question', 'multiple_choice', 'ما عيب {CONCEPT}؟', 'medium', 'disadvantages'),
('comparison_question', 'multiple_choice', 'ما الفرق بين {CONCEPT1} و {CONCEPT2}؟', 'hard', 'comparisons'),
('scenario_question', 'scenario_based', 'في حالة {SCENARIO}، ما الحل المناسب؟', 'hard', 'scenarios'),
('true_false_basic', 'true_false', '{CONCEPT} {STATEMENT}', 'easy', 'facts'),
('fill_blank_definition', 'fill_blank', '{CONCEPT} هو ________ الذي يقوم بـ {FUNCTION}', 'medium', 'definitions');

-- إنشاء فهارس للأداء
CREATE INDEX idx_grade11_lesson_difficulty_lesson_id ON public.grade11_lesson_difficulty_config(lesson_id);
CREATE INDEX idx_grade11_generated_questions_lesson_id ON public.grade11_generated_questions(lesson_id);
CREATE INDEX idx_grade11_generated_questions_difficulty ON public.grade11_generated_questions(difficulty_level);
CREATE INDEX idx_grade11_player_analytics_user_lesson ON public.grade11_player_analytics(user_id, lesson_id);
CREATE INDEX idx_grade11_content_concepts_lesson_id ON public.grade11_content_concepts(lesson_id);

-- تمكين RLS
ALTER TABLE public.grade11_lesson_difficulty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_content_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_player_analytics ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Allow all operations for authenticated users" ON public.grade11_lesson_difficulty_config FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all operations for authenticated users" ON public.grade11_question_templates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all operations for authenticated users" ON public.grade11_content_concepts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all operations for authenticated users" ON public.grade11_generated_questions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow read for authenticated users" ON public.grade11_scoring_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage their own analytics" ON public.grade11_player_analytics FOR ALL USING (auth.uid() = user_id);