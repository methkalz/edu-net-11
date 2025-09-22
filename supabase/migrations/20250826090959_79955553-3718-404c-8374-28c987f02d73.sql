-- Create game questions table linked to Grade 11 content
CREATE TABLE IF NOT EXISTS public.grade11_game_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES grade11_sections(id),
  topic_id UUID REFERENCES grade11_topics(id), 
  lesson_id UUID REFERENCES grade11_lessons(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.grade11_game_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can view game questions"
ON public.grade11_game_questions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "School admins can manage game questions"
ON public.grade11_game_questions FOR ALL
USING (get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- Create player progress table
CREATE TABLE IF NOT EXISTS public.grade11_game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lesson_id UUID NOT NULL REFERENCES grade11_lessons(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 1,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS for progress
ALTER TABLE public.grade11_game_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for progress
CREATE POLICY "Users can manage their own game progress"
ON public.grade11_game_progress FOR ALL
USING (user_id = auth.uid());

-- Create player achievements table
CREATE TABLE IF NOT EXISTS public.grade11_game_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_type TEXT NOT NULL,
  achievement_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for achievements
ALTER TABLE public.grade11_game_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
CREATE POLICY "Users can view their own achievements"
ON public.grade11_game_achievements FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own achievements"
ON public.grade11_game_achievements FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Insert sample questions based on actual content
INSERT INTO public.grade11_game_questions (section_id, topic_id, lesson_id, question_text, choices, correct_answer, explanation, difficulty_level, points)
VALUES 
-- Host questions
('0eaba634-48f2-4e7e-a8e4-e8593eee848b', '78a29295-c716-4390-8687-18787663ebc6', 'eadf3ef5-2bf4-4a45-8e91-ad009a948f27',
'ما هو المضيف في الشبكة؟',
'["أي جهاز متصل بالشبكة", "فقط الخوادم", "فقط أجهزة الحاسوب", "فقط الهواتف الذكية"]',
'أي جهاز متصل بالشبكة',
'المضيف هو أي جهاز متصل بالشبكة مثل الحاسوب أو الهاتف الذكي، ويحتاج إلى عنوان IP للاتصال.',
'easy', 10),

('0eaba634-48f2-4e7e-a8e4-e8593eee848b', '78a29295-c716-4390-8687-18787663ebc6', 'eadf3ef5-2bf4-4a45-8e91-ad009a948f27',
'ما الذي يحتاجه المضيف للاتصال بالشبكة؟',
'["عنوان IP", "كلمة مرور", "برنامج خاص", "إذن من المدير"]',
'عنوان IP',
'كل مضيف في الشبكة يحتاج إلى عنوان IP فريد للتعرف عليه والتواصل معه.',
'medium', 15),

-- Client-Server questions  
('0eaba634-48f2-4e7e-a8e4-e8593eee848b', '78a29295-c716-4390-8687-18787663ebc6', '4aaaace7-925f-45f7-92c5-d16117e33492',
'في شبكة العميل/الخادم، ما دور الخادم؟',
'["يقدم الخدمات للعملاء", "يطلب الخدمات من العملاء", "يراقب الشبكة فقط", "ينظف البيانات"]',
'يقدم الخدمات للعملاء',
'الخادم هو الجهاز المركزي الذي يقدم خدمات مثل البريد الإلكتروني أو قواعد البيانات للعملاء.',
'easy', 10),

('0eaba634-48f2-4e7e-a8e4-e8593eee848b', '78a29295-c716-4390-8687-18787663ebc6', '4aaaace7-925f-45f7-92c5-d16117e33492',
'ما العيب الرئيسي لشبكة العميل/الخادم؟',
'["تعطل الخادم يؤثر على الجميع", "صعوبة الإعداد", "تكلفة عالية", "بطء في النقل"]',
'تعطل الخادم يؤثر على الجميع',
'لأن الخادم مركزي، فإن تعطله يؤثر على جميع العملاء المتصلين به.',
'medium', 15),

-- Peer-to-Peer questions
('0eaba634-48f2-4e7e-a8e4-e8593eee848b', '78a29295-c716-4390-8687-18787663ebc6', '9a9bc0f3-1030-4f58-9109-8453b7ae7ce7',
'ما خصائص شبكة النظير إلى النظير؟',
'["الأجهزة تتصل مباشرة ببعضها", "تحتاج خادم مركزي", "معقدة التركيب", "مكلفة جداً"]',
'الأجهزة تتصل مباشرة ببعضها',
'في شبكة P2P، الأجهزة تتصل مباشرة دون الحاجة لخادم مركزي.',
'easy', 10),

('0eaba634-48f2-4e7e-a8e4-e8593eee848b', '78a29295-c716-4390-8687-18787663ebc6', '9a9bc0f3-1030-4f58-9109-8453b7ae7ce7',
'لماذا لا تناسب شبكة P2P المؤسسات الكبيرة؟',
'["محدودة في الحماية والأمان", "تحتاج معدات خاصة", "بطيئة جداً", "مكلفة التشغيل"]',
'محدودة في الحماية والأمان',
'شبكات P2P سهلة ورخيصة لكنها محدودة في الحماية ولا تناسب المؤسسات الكبيرة.',
'medium', 15);