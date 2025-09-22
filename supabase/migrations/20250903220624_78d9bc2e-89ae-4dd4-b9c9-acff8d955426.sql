-- إنشاء جدول ألعاب المطابقة
CREATE TABLE IF NOT EXISTS public.pair_matching_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  grade_level TEXT NOT NULL DEFAULT '11',
  subject TEXT DEFAULT 'networks',
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  max_pairs INTEGER DEFAULT 6 CHECK (max_pairs >= 2 AND max_pairs <= 12),
  time_limit_seconds INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول أزواج المطابقة
CREATE TABLE IF NOT EXISTS public.pair_matching_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.pair_matching_games(id) ON DELETE CASCADE,
  left_content TEXT NOT NULL,
  right_content TEXT NOT NULL,
  left_type TEXT DEFAULT 'text' CHECK (left_type IN ('text', 'image', 'code')),
  right_type TEXT DEFAULT 'text' CHECK (right_type IN ('text', 'image', 'code')),
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول جلسات المطابقة
CREATE TABLE IF NOT EXISTS public.pair_matching_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.pair_matching_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  completion_time INTEGER, -- بالثواني
  mistakes_count INTEGER DEFAULT 0,
  pairs_matched INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  session_data JSONB DEFAULT '{}'
);

-- إنشاء جدول نتائج المطابقة
CREATE TABLE IF NOT EXISTS public.pair_matching_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.pair_matching_sessions(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES public.pair_matching_pairs(id),
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- بالثواني
  attempts_count INTEGER DEFAULT 1,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة RLS policies
ALTER TABLE public.pair_matching_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_matching_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_matching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_matching_results ENABLE ROW LEVEL SECURITY;

-- Policies للألعاب
CREATE POLICY "Users can view active pair matching games" ON public.pair_matching_games
FOR SELECT USING (is_active = true);

CREATE POLICY "School admins can manage pair matching games" ON public.pair_matching_games
FOR ALL USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]) AND
  (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- Policies للأزواج
CREATE POLICY "Users can view pair matching pairs" ON public.pair_matching_pairs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pair_matching_games g 
    WHERE g.id = pair_matching_pairs.game_id AND g.is_active = true
  )
);

CREATE POLICY "School admins can manage pair matching pairs" ON public.pair_matching_pairs
FOR ALL USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]) AND
  EXISTS (
    SELECT 1 FROM public.pair_matching_games g 
    WHERE g.id = pair_matching_pairs.game_id AND 
    (g.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- Policies للجلسات
CREATE POLICY "Users can manage their own pair matching sessions" ON public.pair_matching_sessions
FOR ALL USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());

CREATE POLICY "Teachers can view school pair matching sessions" ON public.pair_matching_sessions
FOR SELECT USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND
  EXISTS (
    SELECT 1 FROM public.pair_matching_games g 
    WHERE g.id = pair_matching_sessions.game_id AND 
    (g.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- Policies للنتائج  
CREATE POLICY "Users can manage their own pair matching results" ON public.pair_matching_results
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pair_matching_sessions s 
    WHERE s.id = pair_matching_results.session_id AND s.player_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pair_matching_sessions s 
    WHERE s.id = pair_matching_results.session_id AND s.player_id = auth.uid()
  )
);

-- إضافة تريقر تحديث التوقيت
CREATE OR REPLACE FUNCTION update_pair_matching_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pair_matching_games_updated_at
BEFORE UPDATE ON public.pair_matching_games
FOR EACH ROW EXECUTE FUNCTION update_pair_matching_games_updated_at();

-- إدراج لعبة Pair Matching للصف 11
INSERT INTO public.pair_matching_games (title, description, grade_level, subject, difficulty_level, max_pairs, time_limit_seconds)
VALUES (
  'مطابقة المفاهيم التقنية',
  'لعبة تفاعلية لمطابقة المصطلحات التقنية بتعريفاتها لتعزيز الفهم والترابط المعرفي',
  '11',
  'networks',
  'medium',
  6,
  300
);

-- إضافة أزواج المطابقة للشبكات
INSERT INTO public.pair_matching_pairs (game_id, left_content, right_content, explanation, order_index)
SELECT 
  g.id,
  unnest(ARRAY['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'DHCP']) as left_content,
  unnest(ARRAY[
    'بروتوكول نقل موثوق للبيانات', 
    'بروتوكول نقل سريع غير موثوق',
    'بروتوكول نقل النص الفائق',
    'بروتوكول نقل النص الفائق الآمن',
    'نظام أسماء النطاقات',
    'بروتوكول التكوين التلقائي للشبكة'
  ]) as right_content,
  unnest(ARRAY[
    'يضمن وصول البيانات كاملة ومرتبة',
    'أسرع لكن لا يضمن وصول البيانات',
    'يستخدم لتصفح المواقع العادية',
    'نسخة مشفرة من HTTP للأمان',
    'يحول أسماء المواقع إلى عناوين IP',
    'يعطي الأجهزة عناوين IP تلقائياً'
  ]) as explanation,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as order_index
FROM public.pair_matching_games g 
WHERE g.title = 'مطابقة المفاهيم التقنية';