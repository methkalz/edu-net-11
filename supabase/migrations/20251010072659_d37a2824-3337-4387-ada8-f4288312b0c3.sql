-- ===================================
-- المرحلة 1: حذف جداول القوالب القديمة
-- ===================================

-- حذف جدول exam_template_questions أولاً (Foreign Key)
DROP TABLE IF EXISTS public.exam_template_questions CASCADE;

-- حذف جدول exam_templates
DROP TABLE IF EXISTS public.exam_templates CASCADE;

-- ===================================
-- المرحلة 2: إنشاء جدول teacher_exams
-- ===================================

-- جدول الاختبارات التي ينشئها المعلمون مباشرة
CREATE TABLE public.teacher_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Teacher & School Info
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Exam Basic Info
  title TEXT NOT NULL,
  description TEXT,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('10', '11', '12')),
  
  -- Target Classes (can be multiple)
  target_class_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Exam Settings
  total_questions INTEGER NOT NULL DEFAULT 10,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  pass_percentage INTEGER NOT NULL DEFAULT 60 CHECK (pass_percentage >= 0 AND pass_percentage <= 100),
  max_attempts INTEGER NOT NULL DEFAULT 1,
  
  -- Question Configuration
  difficulty_distribution JSONB NOT NULL DEFAULT '{"easy": 30, "medium": 50, "hard": 20}',
  question_sources JSONB NOT NULL DEFAULT '{"type": "random", "sections": []}',
  
  -- Randomization Settings
  randomize_questions BOOLEAN DEFAULT true,
  randomize_answers BOOLEAN DEFAULT true,
  
  -- Exam Timing
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Results Settings
  show_results_immediately BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

-- Indexes for performance
CREATE INDEX idx_teacher_exams_created_by ON public.teacher_exams(created_by);
CREATE INDEX idx_teacher_exams_school_id ON public.teacher_exams(school_id);
CREATE INDEX idx_teacher_exams_grade_level ON public.teacher_exams(grade_level);
CREATE INDEX idx_teacher_exams_status ON public.teacher_exams(status);

-- Auto-update timestamp trigger
CREATE TRIGGER update_teacher_exams_updated_at
BEFORE UPDATE ON public.teacher_exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================
-- المرحلة 3: RLS Policies
-- ===================================

ALTER TABLE public.teacher_exams ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own exams
CREATE POLICY "Teachers can view their own exams"
ON public.teacher_exams FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR (
    SELECT role FROM public.profiles WHERE user_id = auth.uid()
  ) = 'school_admin'
);

-- Teachers can create exams
CREATE POLICY "Teachers can create exams"
ON public.teacher_exams FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND school_id = get_user_school_id()
  AND (
    SELECT role FROM public.profiles WHERE user_id = auth.uid()
  ) IN ('teacher', 'school_admin')
);

-- Teachers can update their own exams
CREATE POLICY "Teachers can update their own exams"
ON public.teacher_exams FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Teachers can delete their own exams
CREATE POLICY "Teachers can delete their own exams"
ON public.teacher_exams FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Students can view published exams for their classes
CREATE POLICY "Students can view published exams"
ON public.teacher_exams FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM class_students cs
    JOIN students s ON s.id = cs.student_id
    WHERE s.user_id = auth.uid()
    AND cs.class_id = ANY(teacher_exams.target_class_ids)
  )
);

-- ===================================
-- المرحلة 4: ربط مع exam_attempts
-- ===================================

-- إضافة عمود جديد في exam_attempts
ALTER TABLE public.exam_attempts
ADD COLUMN IF NOT EXISTS teacher_exam_id UUID REFERENCES public.teacher_exams(id) ON DELETE CASCADE;

-- جعل exam_id اختياري (إذا لم يكن كذلك)
ALTER TABLE public.exam_attempts
ALTER COLUMN exam_id DROP NOT NULL;