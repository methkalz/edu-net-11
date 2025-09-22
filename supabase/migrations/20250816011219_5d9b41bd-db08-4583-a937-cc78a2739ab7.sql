-- Create enum types
CREATE TYPE public.app_role AS ENUM ('superadmin', 'school_admin', 'teacher', 'student', 'parent');
CREATE TYPE public.school_plan AS ENUM ('basic', 'pro');
CREATE TYPE public.file_kind AS ENUM ('pkt', 'pdf', 'image', 'video', 'document');
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');

-- Schools table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan public.school_plan DEFAULT 'basic',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    grade_level TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    max_score INTEGER DEFAULT 100,
    time_limit_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise attempts table
CREATE TABLE public.exercise_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    score INTEGER DEFAULT 0,
    max_score INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    answers JSONB DEFAULT '{}'::jsonb
);

-- Exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    starts_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    randomized BOOLEAN DEFAULT true,
    max_score INTEGER DEFAULT 100,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam questions table
CREATE TABLE public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    bank_category TEXT,
    question_text TEXT NOT NULL,
    question_type public.question_type NOT NULL,
    choices JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam attempts table
CREATE TABLE public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER NOT NULL,
    status TEXT DEFAULT 'in_progress'
);

-- Exam attempt questions table
CREATE TABLE public.exam_attempt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.exam_questions(id),
    display_order INTEGER NOT NULL,
    student_answer TEXT,
    score INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE
);

-- Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project tasks table
CREATE TABLE public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project submissions table
CREATE TABLE public.project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT,
    score INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES auth.users(id)
);

-- Files table
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id),
    lesson_id UUID REFERENCES public.lessons(id),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    kind public.file_kind NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_in_course TEXT NOT NULL CHECK (role_in_course IN ('teacher', 'student')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- Guardians table (parent-student relationship)
CREATE TABLE public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_user_id, student_user_id)
);

-- Video progress tracking
CREATE TABLE public.video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id),
    task_id UUID REFERENCES public.project_tasks(id),
    watched_seconds INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    last_position INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id, task_id)
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Create function to get user role and school
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_courses_school_id ON public.courses(school_id);
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_exercises_lesson_id ON public.exercises(lesson_id);
CREATE INDEX idx_enrollments_course_user ON public.enrollments(course_id, user_id);
CREATE INDEX idx_files_school_id ON public.files(school_id);
CREATE INDEX idx_files_owner ON public.files(owner_user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Basic RLS policies

-- Schools: superadmin can see all, others see only their school
CREATE POLICY "Superadmin can manage all schools" ON public.schools
    FOR ALL USING (public.get_user_role() = 'superadmin');

CREATE POLICY "Users can view their school" ON public.schools
    FOR SELECT USING (id = public.get_user_school_id());

-- Profiles: users can see profiles in their school
CREATE POLICY "Superadmin can manage all profiles" ON public.profiles
    FOR ALL USING (public.get_user_role() = 'superadmin');

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in their school" ON public.profiles
    FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Courses: school-scoped access
CREATE POLICY "School members can view school courses" ON public.courses
    FOR SELECT USING (school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin');

CREATE POLICY "School admins and teachers can manage courses" ON public.courses
    FOR ALL USING (
        school_id = public.get_user_school_id() AND 
        public.get_user_role() IN ('school_admin', 'teacher')
        OR public.get_user_role() = 'superadmin'
    );

-- Lessons: course-based access
CREATE POLICY "Users can view lessons in accessible courses" ON public.lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Exercise attempts: students can see their own attempts
CREATE POLICY "Students can view their own attempts" ON public.exercise_attempts
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own attempts" ON public.exercise_attempts
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts in their school" ON public.exercise_attempts
    FOR SELECT USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.exercises e
            JOIN public.lessons l ON e.lesson_id = l.id
            JOIN public.courses c ON l.course_id = c.id
            WHERE e.id = exercise_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Add similar policies for other tables...
-- (Adding basic policies for now, will expand as needed)

-- Insert some seed data
INSERT INTO public.schools (name, plan) VALUES 
    ('Demo School', 'pro'),
    ('Basic School', 'basic');

-- Get the school IDs for seed data
DO $$
DECLARE
    demo_school_id UUID;
    basic_school_id UUID;
BEGIN
    SELECT id INTO demo_school_id FROM public.schools WHERE name = 'Demo School';
    SELECT id INTO basic_school_id FROM public.schools WHERE name = 'Basic School';
    
    -- Insert demo courses
    INSERT INTO public.courses (school_id, title, description, grade_level) VALUES
        (demo_school_id, 'Computer Networking', 'Introduction to network fundamentals and Cisco Packet Tracer', '10'),
        (demo_school_id, 'Mathematics', 'Advanced mathematics for grade 10', '10'),
        (basic_school_id, 'Basic IT', 'Introduction to Information Technology', '9');
END $$;