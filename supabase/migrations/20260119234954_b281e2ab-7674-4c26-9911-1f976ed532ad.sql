-- Create enum for bagrut question types
CREATE TYPE bagrut_question_type AS ENUM (
  'multiple_choice',      -- اختيار من متعدد
  'true_false',           -- صح/خطأ
  'true_false_multi',     -- صح/خطأ متعدد (عدة أقوال)
  'fill_blank',           -- إكمال الفراغ
  'fill_table',           -- إكمال جدول
  'matching',             -- مطابقة (ربط عناصر)
  'ordering',             -- ترتيب
  'calculation',          -- حسابي (مع خطوات)
  'diagram_based',        -- يعتمد على رسم/مخطط
  'cli_command',          -- أوامر CLI
  'open_ended',           -- مفتوح (شرح)
  'multi_part'            -- متعدد البنود
);

-- Create enum for exam status
CREATE TYPE bagrut_exam_status AS ENUM (
  'draft',
  'processing',
  'ready',
  'published',
  'archived'
);

-- Create enum for attempt status
CREATE TYPE bagrut_attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'graded'
);

-- Create enum for section type
CREATE TYPE bagrut_section_type AS ENUM (
  'mandatory',
  'elective'
);

-- Create enum for exam season
CREATE TYPE bagrut_exam_season AS ENUM (
  'summer',
  'winter',
  'spring'
);

-- Main bagrut exams table
CREATE TABLE public.bagrut_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_year INTEGER NOT NULL,
  exam_season bagrut_exam_season NOT NULL,
  exam_code TEXT,
  subject TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 180,
  total_points INTEGER DEFAULT 100,
  
  -- Availability settings
  is_published BOOLEAN DEFAULT false,
  available_for_grades TEXT[] DEFAULT '{}',
  available_for_specializations TEXT[] DEFAULT '{}',
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Source file
  source_file_url TEXT,
  source_file_type TEXT,
  source_file_name TEXT,
  
  -- Display settings
  show_answers_to_students BOOLEAN DEFAULT false,
  show_answers_to_teachers BOOLEAN DEFAULT true,
  show_explanations BOOLEAN DEFAULT true,
  allow_review_after_submit BOOLEAN DEFAULT true,
  
  -- Status and processing
  status bagrut_exam_status DEFAULT 'draft',
  ai_processing_log JSONB DEFAULT '{}',
  ai_parsed_at TIMESTAMPTZ,
  
  -- Metadata
  instructions TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exam sections table
CREATE TABLE public.bagrut_exam_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.bagrut_exams(id) ON DELETE CASCADE,
  
  section_number INTEGER NOT NULL,
  section_title TEXT NOT NULL,
  section_type bagrut_section_type NOT NULL DEFAULT 'mandatory',
  total_points INTEGER NOT NULL,
  
  -- For elective sections
  specialization TEXT,
  specialization_label TEXT,
  instructions TEXT,
  
  -- Student can choose how many questions to answer
  min_questions_to_answer INTEGER,
  max_questions_to_answer INTEGER,
  
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table with rich content support
CREATE TABLE public.bagrut_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.bagrut_exams(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.bagrut_exam_sections(id) ON DELETE CASCADE,
  
  question_number TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type bagrut_question_type NOT NULL,
  points INTEGER NOT NULL,
  
  -- Rich content
  has_image BOOLEAN DEFAULT false,
  image_url TEXT,
  image_alt_text TEXT,
  has_table BOOLEAN DEFAULT false,
  table_data JSONB,
  has_code BOOLEAN DEFAULT false,
  code_content TEXT,
  code_language TEXT,
  
  -- Choices and answers
  choices JSONB,
  correct_answer TEXT,
  correct_answer_data JSONB,
  answer_explanation TEXT,
  
  -- For multi-part questions
  parent_question_id UUID REFERENCES public.bagrut_questions(id) ON DELETE CASCADE,
  sub_question_label TEXT,
  
  -- Metadata
  topic_tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'medium',
  
  order_index INTEGER DEFAULT 0,
  is_bonus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Media files table
CREATE TABLE public.bagrut_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.bagrut_exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.bagrut_questions(id) ON DELETE CASCADE,
  
  media_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  original_filename TEXT,
  alt_text TEXT,
  extracted_text TEXT,
  
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student attempts table
CREATE TABLE public.bagrut_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.bagrut_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  school_id UUID REFERENCES public.schools(id),
  
  -- Selected specialization for elective sections
  selected_specialization TEXT,
  selected_section_ids UUID[] DEFAULT '{}',
  
  status bagrut_attempt_status DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id),
  
  -- Answers stored as JSON
  answers JSONB DEFAULT '{}',
  
  -- Results
  score INTEGER,
  max_score INTEGER,
  percentage NUMERIC(5,2),
  section_scores JSONB DEFAULT '{}',
  detailed_results JSONB DEFAULT '{}',
  
  -- Time tracking
  time_spent_seconds INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  
  -- Feedback
  teacher_feedback TEXT,
  
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_bagrut_exams_status ON public.bagrut_exams(status);
CREATE INDEX idx_bagrut_exams_published ON public.bagrut_exams(is_published);
CREATE INDEX idx_bagrut_exams_year ON public.bagrut_exams(exam_year);
CREATE INDEX idx_bagrut_exams_created_by ON public.bagrut_exams(created_by);

CREATE INDEX idx_bagrut_sections_exam ON public.bagrut_exam_sections(exam_id);
CREATE INDEX idx_bagrut_sections_type ON public.bagrut_exam_sections(section_type);

CREATE INDEX idx_bagrut_questions_exam ON public.bagrut_questions(exam_id);
CREATE INDEX idx_bagrut_questions_section ON public.bagrut_questions(section_id);
CREATE INDEX idx_bagrut_questions_parent ON public.bagrut_questions(parent_question_id);
CREATE INDEX idx_bagrut_questions_type ON public.bagrut_questions(question_type);

CREATE INDEX idx_bagrut_media_exam ON public.bagrut_media(exam_id);
CREATE INDEX idx_bagrut_media_question ON public.bagrut_media(question_id);

CREATE INDEX idx_bagrut_attempts_exam ON public.bagrut_attempts(exam_id);
CREATE INDEX idx_bagrut_attempts_student ON public.bagrut_attempts(student_id);
CREATE INDEX idx_bagrut_attempts_school ON public.bagrut_attempts(school_id);
CREATE INDEX idx_bagrut_attempts_status ON public.bagrut_attempts(status);

-- Enable RLS on all tables
ALTER TABLE public.bagrut_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bagrut_exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bagrut_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bagrut_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bagrut_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bagrut_exams
CREATE POLICY "Superadmins can manage all bagrut exams"
ON public.bagrut_exams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'superadmin'
  )
);

CREATE POLICY "Teachers can view published bagrut exams"
ON public.bagrut_exams FOR SELECT
USING (
  is_published = true
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('teacher', 'school_admin')
  )
);

CREATE POLICY "Students can view available published bagrut exams"
ON public.bagrut_exams FOR SELECT
USING (
  is_published = true
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.students s ON s.user_id = p.user_id
    JOIN public.class_students cs ON cs.student_id = s.id
    JOIN public.classes c ON c.id = cs.class_id
    JOIN public.grade_levels gl ON gl.id = c.grade_level_id
    WHERE p.user_id = auth.uid()
    AND p.role = 'student'
    AND gl.code = ANY(available_for_grades)
  )
);

-- RLS Policies for bagrut_exam_sections
CREATE POLICY "Superadmins can manage all sections"
ON public.bagrut_exam_sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'superadmin'
  )
);

CREATE POLICY "Users can view sections of accessible exams"
ON public.bagrut_exam_sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bagrut_exams e
    WHERE e.id = exam_id
    AND (
      e.is_published = true
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    )
  )
);

-- RLS Policies for bagrut_questions
CREATE POLICY "Superadmins can manage all questions"
ON public.bagrut_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'superadmin'
  )
);

CREATE POLICY "Users can view questions of accessible exams"
ON public.bagrut_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bagrut_exams e
    WHERE e.id = exam_id
    AND (
      e.is_published = true
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    )
  )
);

-- RLS Policies for bagrut_media
CREATE POLICY "Superadmins can manage all media"
ON public.bagrut_media FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'superadmin'
  )
);

CREATE POLICY "Users can view media of accessible exams"
ON public.bagrut_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bagrut_exams e
    WHERE e.id = exam_id
    AND (
      e.is_published = true
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    )
  )
);

-- RLS Policies for bagrut_attempts
CREATE POLICY "Superadmins can view all attempts"
ON public.bagrut_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'superadmin'
  )
);

CREATE POLICY "Students can manage their own attempts"
ON public.bagrut_attempts FOR ALL
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts from their school"
ON public.bagrut_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('teacher', 'school_admin')
    AND p.school_id = school_id
  )
);

-- Trigger for updating updated_at
CREATE TRIGGER update_bagrut_exams_updated_at
BEFORE UPDATE ON public.bagrut_exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bagrut_questions_updated_at
BEFORE UPDATE ON public.bagrut_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bagrut_attempts_updated_at
BEFORE UPDATE ON public.bagrut_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();