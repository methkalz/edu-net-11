-- Create table for Grade 11 educational terms extracted from lessons
CREATE TABLE public.grade11_educational_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term_text TEXT NOT NULL,
  definition TEXT NOT NULL,
  term_type TEXT NOT NULL DEFAULT 'concept', -- concept, device, protocol, technology, etc.
  difficulty_level TEXT NOT NULL DEFAULT 'medium', -- easy, medium, hard
  importance_level INTEGER NOT NULL DEFAULT 1, -- 1-5 scale
  section_id UUID REFERENCES grade11_sections(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES grade11_topics(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES grade11_lessons(id) ON DELETE CASCADE,
  extracted_from_content BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  approved_by UUID
);

-- Enable RLS
ALTER TABLE public.grade11_educational_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view approved terms" 
ON public.grade11_educational_terms 
FOR SELECT 
USING (is_approved = true OR auth.uid() IS NOT NULL);

CREATE POLICY "School admins can manage terms" 
ON public.grade11_educational_terms 
FOR ALL 
USING (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- Create indexes for better performance
CREATE INDEX idx_grade11_educational_terms_section ON grade11_educational_terms(section_id);
CREATE INDEX idx_grade11_educational_terms_topic ON grade11_educational_terms(topic_id);
CREATE INDEX idx_grade11_educational_terms_lesson ON grade11_educational_terms(lesson_id);
CREATE INDEX idx_grade11_educational_terms_difficulty ON grade11_educational_terms(difficulty_level);
CREATE INDEX idx_grade11_educational_terms_approved ON grade11_educational_terms(is_approved);

-- Update trigger
CREATE TRIGGER update_grade11_educational_terms_updated_at
BEFORE UPDATE ON public.grade11_educational_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to link educational content to matching games
CREATE TABLE public.grade11_content_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES pair_matching_games(id) ON DELETE CASCADE,
  section_id UUID REFERENCES grade11_sections(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES grade11_topics(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES grade11_lessons(id) ON DELETE SET NULL,
  term_selection_criteria JSONB DEFAULT '{"difficulty": ["easy", "medium"], "max_terms": 8}'::jsonb,
  auto_generate_pairs BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS for content games
ALTER TABLE public.grade11_content_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content games
CREATE POLICY "Users can view active content games" 
ON public.grade11_content_games 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "School admins can manage content games" 
ON public.grade11_content_games 
FOR ALL 
USING (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- Update trigger for content games
CREATE TRIGGER update_grade11_content_games_updated_at
BEFORE UPDATE ON public.grade11_content_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_grade11_content_games_game ON grade11_content_games(game_id);
CREATE INDEX idx_grade11_content_games_section ON grade11_content_games(section_id);
CREATE INDEX idx_grade11_content_games_active ON grade11_content_games(is_active);

-- Insert sample educational terms from the curriculum content
INSERT INTO public.grade11_educational_terms (term_text, definition, term_type, difficulty_level, importance_level, section_id, is_approved) VALUES
('راوتر (Router)', 'جهاز شبكة يقوم بتوجيه حزم البيانات بين شبكات مختلفة ويعمل في الطبقة الثالثة من نموذج OSI', 'device', 'easy', 5, (SELECT id FROM grade11_sections WHERE title LIKE '%أساسيات الاتصال%' LIMIT 1), true),
('سويتش (Switch)', 'جهاز شبكة يربط عدة أجهزة في شبكة محلية واحدة ويعمل في طبقة ربط البيانات', 'device', 'easy', 5, (SELECT id FROM grade11_sections WHERE title LIKE '%أساسيات الاتصال%' LIMIT 1), true),
('عنوان IP', 'رقم فريد يُستخدم لتحديد هوية جهاز في الشبكة ويمكن أن يكون IPv4 أو IPv6', 'concept', 'easy', 5, (SELECT id FROM grade11_sections WHERE title LIKE '%طرق الترقيم%' LIMIT 1), true),
('عنوان MAC', 'عنوان فيزيائي فريد ومحفور في كرت الشبكة لكل جهاز، ويستخدم في الطبقة الثانية', 'concept', 'medium', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%أساسيات الاتصال%' LIMIT 1), true),
('بروتوكول TCP', 'بروتوكول موثوق لنقل البيانات يضمن وصول البيانات كاملة ومرتبة', 'protocol', 'medium', 5, (SELECT id FROM grade11_sections WHERE title LIKE '%البروتوكولات%' LIMIT 1), true),
('بروتوكول UDP', 'بروتوكول سريع لنقل البيانات لكنه غير موثوق ولا يضمن وصول البيانات', 'protocol', 'medium', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%البروتوكولات%' LIMIT 1), true),
('DHCP', 'خدمة تقوم بتوزيع عناوين IP تلقائياً على الأجهزة في الشبكة', 'technology', 'easy', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%أساسيات الاتصال%' LIMIT 1), true),
('DNS', 'نظام تحويل أسماء المواقع إلى عناوين IP للوصول إلى المواقع على الإنترنت', 'technology', 'easy', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%أساسيات الاتصال%' LIMIT 1), true),
('إيثرنت (Ethernet)', 'تقنية الربط الأكثر شيوعاً في الشبكات المحلية باستخدام الكابلات', 'technology', 'easy', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%الطبقة الفيزيائية%' LIMIT 1), true),
('نموذج OSI', 'نموذج مرجعي يقسم عملية الاتصال إلى سبع طبقات لتسهيل فهم وتطوير الشبكات', 'concept', 'hard', 5, (SELECT id FROM grade11_sections WHERE title LIKE '%البروتوكولات%' LIMIT 1), true),
('الطبقة الفيزيائية', 'الطبقة الأولى في نموذج OSI التي تتعامل مع نقل البتات عبر الوسائط الفيزيائية', 'concept', 'medium', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%الطبقة الفيزيائية%' LIMIT 1), true),
('طبقة ربط البيانات', 'الطبقة الثانية في نموذج OSI التي تتعامل مع الإطارات وعناوين MAC', 'concept', 'medium', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%البروتوكولات%' LIMIT 1), true),
('طبقة الشبكة', 'الطبقة الثالثة في نموذج OSI التي تتعامل مع التوجيه وعناوين IP', 'concept', 'medium', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%البروتوكولات%' LIMIT 1), true),
('النظام الثنائي', 'نظام العد الذي يستخدم الرقمين 0 و 1 فقط وهو أساس عمل الحاسوب', 'concept', 'easy', 3, (SELECT id FROM grade11_sections WHERE title LIKE '%طرق الترقيم%' LIMIT 1), true),
('IPv4', 'إصدار رابع من بروتوكول الإنترنت يستخدم عناوين بطول 32 بت', 'protocol', 'medium', 4, (SELECT id FROM grade11_sections WHERE title LIKE '%طرق الترقيم%' LIMIT 1), true),
('IPv6', 'إصدار سادس من بروتوكول الإنترنت يستخدم عناوين بطول 128 بت لحل مشكلة نفاد عناوين IPv4', 'protocol', 'hard', 3, (SELECT id FROM grade11_sections WHERE title LIKE '%طرق الترقيم%' LIMIT 1), true);