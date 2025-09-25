-- إعادة إنشاء جداول اللعبة للصف العاشر بالهيكل الصحيح

-- حذف الجداول إذا كانت موجودة
DROP TABLE IF EXISTS public.grade10_game_achievements CASCADE;
DROP TABLE IF EXISTS public.grade10_game_progress CASCADE; 
DROP TABLE IF EXISTS public.grade10_game_questions CASCADE;
DROP TABLE IF EXISTS public.grade10_player_profiles CASCADE;

-- جدول ملفات تعريف اللاعبين للصف العاشر
CREATE TABLE public.grade10_player_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  avatar_url TEXT,
  level_number INTEGER NOT NULL DEFAULT 1,
  experience_points INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  achievements JSONB NOT NULL DEFAULT '[]'::JSONB,
  statistics JSONB NOT NULL DEFAULT '{}'::JSONB,
  preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أسئلة اللعبة للصف العاشر
CREATE TABLE public.grade10_game_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID,
  topic_id UUID,
  lesson_id UUID,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  choices JSONB NOT NULL DEFAULT '[]'::JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  points INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تقدم اللاعبين للصف العاشر
CREATE TABLE public.grade10_game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.grade10_player_profiles(id) ON DELETE CASCADE,
  lesson_id UUID,
  question_id UUID REFERENCES public.grade10_game_questions(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  user_answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  feedback JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إنجازات اللاعبين للصف العاشر  
CREATE TABLE public.grade10_game_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.grade10_player_profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_grade10_player_profiles_user_id ON public.grade10_player_profiles(user_id);
CREATE INDEX idx_grade10_game_questions_active ON public.grade10_game_questions(is_active);
CREATE INDEX idx_grade10_game_questions_difficulty ON public.grade10_game_questions(difficulty_level);
CREATE INDEX idx_grade10_game_progress_player_id ON public.grade10_game_progress(player_id);
CREATE INDEX idx_grade10_game_progress_completed ON public.grade10_game_progress(is_completed);
CREATE INDEX idx_grade10_game_achievements_player_id ON public.grade10_game_achievements(player_id);
CREATE INDEX idx_grade10_game_achievements_unlocked ON public.grade10_game_achievements(is_unlocked);

-- تمكين RLS على جميع الجداول
ALTER TABLE public.grade10_player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_game_achievements ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للملفات الشخصية
CREATE POLICY "المستخدمون يمكنهم رؤية ملفاتهم الشخصية للصف العاشر" ON public.grade10_player_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم إنشاء ملفاتهم الشخصية للصف العاشر" ON public.grade10_player_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم تحديث ملفاتهم الشخصية للصف العاشر" ON public.grade10_player_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- سياسات الأمان للأسئلة
CREATE POLICY "الجميع يمكنهم رؤية الأسئلة النشطة للصف العاشر" ON public.grade10_game_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "المدراء يمكنهم إدارة أسئلة الصف العاشر" ON public.grade10_game_questions
  FOR ALL USING (get_user_role() = ANY(ARRAY['superadmin'::app_role, 'school_admin'::app_role]));

-- سياسات الأمان للتقدم
CREATE POLICY "اللاعبون يمكنهم رؤية تقدمهم للصف العاشر" ON public.grade10_game_progress
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.grade10_player_profiles pp 
    WHERE pp.id = grade10_game_progress.player_id 
    AND pp.user_id = auth.uid()
  ));

CREATE POLICY "اللاعبون يمكنهم إنشاء تقدمهم للصف العاشر" ON public.grade10_game_progress
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.grade10_player_profiles pp 
    WHERE pp.id = grade10_game_progress.player_id 
    AND pp.user_id = auth.uid()
  ));

CREATE POLICY "اللاعبون يمكنهم تحديث تقدمهم للصف العاشر" ON public.grade10_game_progress
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.grade10_player_profiles pp 
    WHERE pp.id = grade10_game_progress.player_id 
    AND pp.user_id = auth.uid()
  ));

-- سياسات الأمان للإنجازات
CREATE POLICY "اللاعبون يمكنهم رؤية إنجازاتهم للصف العاشر" ON public.grade10_game_achievements
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.grade10_player_profiles pp 
    WHERE pp.id = grade10_game_achievements.player_id 
    AND pp.user_id = auth.uid()
  ));

CREATE POLICY "اللاعبون يمكنهم إنشاء إنجازاتهم للصف العاشر" ON public.grade10_game_achievements
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.grade10_player_profiles pp 
    WHERE pp.id = grade10_game_achievements.player_id 
    AND pp.user_id = auth.uid()
  ));

-- إنشاء تحديث updated_at تلقائياً
CREATE TRIGGER update_grade10_player_profiles_updated_at
  BEFORE UPDATE ON public.grade10_player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade10_game_questions_updated_at
  BEFORE UPDATE ON public.grade10_game_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade10_game_progress_updated_at
  BEFORE UPDATE ON public.grade10_game_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- نسخ الأسئلة من الصف الحادي عشر للعاشر
INSERT INTO public.grade10_game_questions (
  section_id, topic_id, lesson_id, question_text, question_type, 
  choices, correct_answer, difficulty_level, points, explanation, 
  is_active, order_index, created_by
)
SELECT 
  section_id, topic_id, lesson_id, question_text, question_type,
  choices, correct_answer, difficulty_level, points, explanation,
  true, ROW_NUMBER() OVER (ORDER BY created_at), created_by
FROM public.grade11_game_questions;