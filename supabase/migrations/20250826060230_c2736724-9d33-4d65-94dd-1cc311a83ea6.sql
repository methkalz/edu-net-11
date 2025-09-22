-- Create difficulty levels enum
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Create question categories table
CREATE TABLE public.question_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'BookOpen',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create question bank table (separate from exam_questions)
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  choices JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  explanation TEXT,
  difficulty_level question_difficulty NOT NULL DEFAULT 'medium',
  points INTEGER DEFAULT 1,
  category_id UUID REFERENCES public.question_categories(id),
  -- Link to educational content
  section_id UUID REFERENCES public.grade11_sections(id),
  topic_id UUID REFERENCES public.grade11_topics(id),
  lesson_id UUID REFERENCES public.grade11_lessons(id),
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  school_id UUID REFERENCES public.schools(id)
);

-- Create exam templates table
CREATE TABLE public.exam_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  grade_level TEXT NOT NULL DEFAULT '11',
  total_questions INTEGER NOT NULL DEFAULT 10,
  duration_minutes INTEGER DEFAULT 60,
  difficulty_distribution JSONB DEFAULT '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
  randomize_questions BOOLEAN DEFAULT true,
  randomize_answers BOOLEAN DEFAULT true,
  pass_percentage INTEGER DEFAULT 60,
  max_attempts INTEGER DEFAULT 1,
  show_results_immediately BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  school_id UUID REFERENCES public.schools(id)
);

-- Create exam template questions (linking templates to question bank)
CREATE TABLE public.exam_template_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.exam_templates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.question_bank(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  points_override INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update existing exam_questions table to link with question bank
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS difficulty_level question_difficulty DEFAULT 'medium';
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.question_categories(id);
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.grade11_sections(id);
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.grade11_topics(id);
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.grade11_lessons(id);
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS question_bank_id UUID REFERENCES public.question_bank(id);

-- Update existing exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS grade_level TEXT DEFAULT '11';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.exam_templates(id);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS pass_percentage INTEGER DEFAULT 60;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT false;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_template_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_categories
CREATE POLICY "Everyone can view question categories" 
ON public.question_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmins can manage question categories" 
ON public.question_categories 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

-- RLS Policies for question_bank
CREATE POLICY "School members can view question bank" 
ON public.question_bank 
FOR SELECT 
USING (
  is_active = true AND (
    school_id IS NULL OR 
    school_id = get_user_school_id() OR 
    get_user_role() = 'superadmin'::app_role
  )
);

CREATE POLICY "School admins and superadmins can manage question bank" 
ON public.question_bank 
FOR ALL 
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]) AND (
    school_id = get_user_school_id() OR 
    get_user_role() = 'superadmin'::app_role
  )
);

-- RLS Policies for exam_templates
CREATE POLICY "School members can view exam templates" 
ON public.exam_templates 
FOR SELECT 
USING (
  is_active = true AND (
    school_id = get_user_school_id() OR 
    get_user_role() = 'superadmin'::app_role
  )
);

CREATE POLICY "School admins and superadmins can manage exam templates" 
ON public.exam_templates 
FOR ALL 
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]) AND (
    school_id = get_user_school_id() OR 
    get_user_role() = 'superadmin'::app_role
  )
);

-- RLS Policies for exam_template_questions
CREATE POLICY "Users can view exam template questions" 
ON public.exam_template_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exam_templates et 
    WHERE et.id = exam_template_questions.template_id 
    AND (et.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

CREATE POLICY "School admins can manage exam template questions" 
ON public.exam_template_questions 
FOR ALL 
USING (
  get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]) AND
  EXISTS (
    SELECT 1 FROM public.exam_templates et 
    WHERE et.id = exam_template_questions.template_id 
    AND (et.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- Create indexes for better performance
CREATE INDEX idx_question_bank_difficulty ON public.question_bank(difficulty_level);
CREATE INDEX idx_question_bank_category ON public.question_bank(category_id);
CREATE INDEX idx_question_bank_section ON public.question_bank(section_id);
CREATE INDEX idx_question_bank_topic ON public.question_bank(topic_id);
CREATE INDEX idx_question_bank_lesson ON public.question_bank(lesson_id);
CREATE INDEX idx_question_bank_school ON public.question_bank(school_id);
CREATE INDEX idx_exam_templates_grade ON public.exam_templates(grade_level);
CREATE INDEX idx_exam_template_questions_template ON public.exam_template_questions(template_id);

-- Insert default question categories
INSERT INTO public.question_categories (name, name_ar, description, color, icon) VALUES
('Mathematics', 'الرياضيات', 'Mathematical questions and problems', '#FF6B6B', 'Calculator'),
('Science', 'العلوم', 'Science and physics questions', '#4ECDC4', 'Microscope'),
('Arabic Language', 'اللغة العربية', 'Arabic language and literature', '#45B7D1', 'BookOpen'),
('English Language', 'اللغة الإنجليزية', 'English language questions', '#96CEB4', 'Globe'),
('History', 'التاريخ', 'Historical questions and events', '#FECA57', 'Clock'),
('Geography', 'الجغرافيا', 'Geography and earth sciences', '#FF9FF3', 'Map');