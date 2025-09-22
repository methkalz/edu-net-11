-- إنشاء جدول الألعاب
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT NOT NULL DEFAULT '11',
  subject TEXT DEFAULT 'networks',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول بيانات اللاعبين
CREATE TABLE public.grade11_player_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 100,
  streak_days INTEGER DEFAULT 0,
  avatar_id TEXT DEFAULT 'student1',
  total_xp INTEGER DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- إنشاء جدول جلسات اللعب
CREATE TABLE public.grade11_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.grade11_lessons(id) ON DELETE CASCADE,
  session_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إدراج لعبة افتراضية
INSERT INTO public.games (name, description, grade_level, subject) 
VALUES ('مغامرة الشبكات', 'لعبة تعليمية لاستكشاف عالم شبكات الحاسوب للصف الحادي عشر', '11', 'networks');

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_game_sessions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لجدول الألعاب
CREATE POLICY "Anyone can view active games" 
ON public.games 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage games" 
ON public.games 
FOR ALL 
USING (get_user_role() IN ('superadmin', 'school_admin'));

-- إنشاء سياسات الأمان لجدول بيانات اللاعبين
CREATE POLICY "Users can view their own player profile" 
ON public.grade11_player_profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own player profile" 
ON public.grade11_player_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own player profile" 
ON public.grade11_player_profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own player profile" 
ON public.grade11_player_profiles 
FOR DELETE 
USING (user_id = auth.uid());

-- إنشاء سياسات الأمان لجدول جلسات اللعب
CREATE POLICY "Users can view their own game sessions" 
ON public.grade11_game_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own game sessions" 
ON public.grade11_game_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own game sessions" 
ON public.grade11_game_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own game sessions" 
ON public.grade11_game_sessions 
FOR DELETE 
USING (user_id = auth.uid());

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_player_profiles_user_id ON public.grade11_player_profiles(user_id);
CREATE INDEX idx_player_profiles_game_id ON public.grade11_player_profiles(game_id);
CREATE INDEX idx_game_sessions_user_id ON public.grade11_game_sessions(user_id);
CREATE INDEX idx_game_sessions_lesson_id ON public.grade11_game_sessions(lesson_id);
CREATE INDEX idx_game_sessions_created_at ON public.grade11_game_sessions(created_at);

-- إنشاء دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء triggers للتحديث التلقائي
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at
    BEFORE UPDATE ON public.grade11_player_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
    BEFORE UPDATE ON public.grade11_game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();