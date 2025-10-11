-- المرحلة 1 و 2: إنشاء نظام الامتحانات الإلكترونية

CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'short_answer',
  'essay'
);

CREATE TYPE question_difficulty AS ENUM (
  'easy',
  'medium',
  'hard'
);

CREATE TYPE exam_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'ended',
  'archived'
);

CREATE TYPE attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'auto_submitted',
  'expired'
);

CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  choices JSONB DEFAULT NULL,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  difficulty question_difficulty NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('10', '11')),
  section_name TEXT,
  topic_name TEXT,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.teacher_custom_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  choices JSONB DEFAULT NULL,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  difficulty question_difficulty NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('10', '11')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_levels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_classes UUID[] DEFAULT ARRAY[]::UUID[],
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  passing_percentage INTEGER NOT NULL DEFAULT 50 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
  duration_minutes INTEGER NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  show_results_immediately BOOLEAN NOT NULL DEFAULT true,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_choices BOOLEAN NOT NULL DEFAULT false,
  allow_review BOOLEAN NOT NULL DEFAULT true,
  status exam_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_datetime > start_datetime)
);

CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_source TEXT NOT NULL CHECK (question_source IN ('bank', 'custom')),
  question_bank_id UUID REFERENCES public.question_bank(id) ON DELETE CASCADE,
  custom_question_id UUID REFERENCES public.teacher_custom_questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  points_override INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_source_check CHECK (
    (question_source = 'bank' AND question_bank_id IS NOT NULL AND custom_question_id IS NULL) OR
    (question_source = 'custom' AND question_bank_id IS NULL AND custom_question_id IS NOT NULL)
  )
);

CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ DEFAULT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  questions_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  score NUMERIC DEFAULT NULL,
  percentage NUMERIC DEFAULT NULL,
  passed BOOLEAN DEFAULT NULL,
  detailed_results JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_attempt UNIQUE (exam_id, student_id, attempt_number)
);

CREATE TABLE public.exam_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE UNIQUE,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  avg_score NUMERIC DEFAULT NULL,
  avg_time_spent INTEGER DEFAULT NULL,
  pass_rate NUMERIC DEFAULT NULL,
  question_stats JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_bank_grade_level ON public.question_bank(grade_level);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX idx_question_bank_created_by ON public.question_bank(created_by);
CREATE INDEX idx_question_bank_active ON public.question_bank(is_active);

CREATE INDEX idx_teacher_questions_teacher_id ON public.teacher_custom_questions(teacher_id);
CREATE INDEX idx_teacher_questions_school_id ON public.teacher_custom_questions(school_id);
CREATE INDEX idx_teacher_questions_grade_level ON public.teacher_custom_questions(grade_level);
CREATE INDEX idx_teacher_questions_active ON public.teacher_custom_questions(is_active);

CREATE INDEX idx_exams_created_by ON public.exams(created_by);
CREATE INDEX idx_exams_school_id ON public.exams(school_id);
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_exams_start_datetime ON public.exams(start_datetime);
CREATE INDEX idx_exams_end_datetime ON public.exams(end_datetime);
CREATE INDEX idx_exams_grade_levels ON public.exams USING GIN(grade_levels);

CREATE INDEX idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX idx_exam_questions_order ON public.exam_questions(exam_id, question_order);

CREATE INDEX idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_status ON public.exam_attempts(status);
CREATE INDEX idx_exam_attempts_school_id ON public.exam_attempts(school_id);

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_custom_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to question bank"
  ON public.question_bank FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));

CREATE POLICY "Teachers can view active questions"
  ON public.question_bank FOR SELECT
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'teacher'));

CREATE POLICY "Teachers full access to their questions"
  ON public.teacher_custom_questions FOR ALL
  USING (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'teacher'))
  WITH CHECK (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'teacher'));

CREATE POLICY "Super admin can view teacher questions"
  ON public.teacher_custom_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));

CREATE POLICY "Teachers full access to their exams"
  ON public.exams FOR ALL
  USING (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'teacher'))
  WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'teacher'));

CREATE POLICY "Students can view their available exams"
  ON public.exams FOR SELECT
  USING (
    status IN ('scheduled', 'active')
    AND EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.class_students cs ON cs.student_id = s.id
      JOIN public.classes c ON c.id = cs.class_id
      JOIN public.grade_levels gl ON gl.id = c.grade_level_id
      WHERE s.user_id = auth.uid()
      AND (gl.code = ANY(exams.grade_levels) OR gl.label = ANY(exams.grade_levels))
    )
  );

CREATE POLICY "School admin can view school exams"
  ON public.exams FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'school_admin' AND profiles.school_id = exams.school_id));

CREATE POLICY "Super admin full access to exams"
  ON public.exams FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));

CREATE POLICY "Teachers full access to their exam questions"
  ON public.exam_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_questions.exam_id AND exams.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_questions.exam_id AND exams.created_by = auth.uid()));

CREATE POLICY "Students can view exam questions"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.students s ON s.user_id = auth.uid()
      JOIN public.class_students cs ON cs.student_id = s.id
      JOIN public.classes c ON c.id = cs.class_id
      JOIN public.grade_levels gl ON gl.id = c.grade_level_id
      WHERE e.id = exam_questions.exam_id
      AND e.status IN ('scheduled', 'active')
      AND (gl.code = ANY(e.grade_levels) OR gl.label = ANY(e.grade_levels))
    )
  );

CREATE POLICY "Students full access to their attempts"
  ON public.exam_attempts FOR ALL
  USING (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'student'))
  WITH CHECK (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'student'));

CREATE POLICY "Teachers can view attempts for their exams"
  ON public.exam_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_attempts.exam_id AND exams.created_by = auth.uid()));

CREATE POLICY "School admin can view school attempts"
  ON public.exam_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'school_admin' AND profiles.school_id = exam_attempts.school_id));

CREATE POLICY "Super admin can view all attempts"
  ON public.exam_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));

CREATE POLICY "Teachers can view their exam analytics"
  ON public.exam_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_analytics.exam_id AND exams.created_by = auth.uid()));

CREATE POLICY "School admin can view school analytics"
  ON public.exam_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_analytics.exam_id AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'school_admin' AND profiles.school_id = e.school_id)));

CREATE POLICY "Super admin full access to analytics"
  ON public.exam_analytics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));

CREATE TRIGGER update_question_bank_updated_at
  BEFORE UPDATE ON public.question_bank FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_questions_updated_at
  BEFORE UPDATE ON public.teacher_custom_questions FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_attempts_updated_at
  BEFORE UPDATE ON public.exam_attempts FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();