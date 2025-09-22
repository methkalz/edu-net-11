-- Fix security functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Add missing RLS policies for tables that need them

-- Exercises policies
CREATE POLICY "Users can view exercises in their school courses" ON public.exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.courses c ON l.course_id = c.id
            WHERE l.id = lesson_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers can manage exercises in their school" ON public.exercises
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.courses c ON l.course_id = c.id
            WHERE l.id = lesson_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Exams policies  
CREATE POLICY "Users can view exams in their school courses" ON public.exams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers can manage exams in their school" ON public.exams
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Exam questions policies
CREATE POLICY "Users can view exam questions in accessible exams" ON public.exam_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            JOIN public.courses c ON e.course_id = c.id
            WHERE e.id = exam_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers can manage exam questions" ON public.exam_questions
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.exams e
            JOIN public.courses c ON e.course_id = c.id
            WHERE e.id = exam_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Exam attempts policies (already added basic ones, expanding)
CREATE POLICY "Teachers can manage exam attempts in their school" ON public.exam_attempts
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.exams e
            JOIN public.courses c ON e.course_id = c.id
            WHERE e.id = exam_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Exam attempt questions policies
CREATE POLICY "Students can view their own exam attempt questions" ON public.exam_attempt_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id AND ea.student_id = auth.uid()
        )
    );

CREATE POLICY "Students can manage their own exam attempt questions" ON public.exam_attempt_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id AND ea.student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view exam attempt questions in their school" ON public.exam_attempt_questions
    FOR SELECT USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            JOIN public.exams e ON ea.exam_id = e.id
            JOIN public.courses c ON e.course_id = c.id
            WHERE ea.id = attempt_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Projects policies
CREATE POLICY "Users can view projects in their school courses" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers can manage projects in their school" ON public.projects
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Project tasks policies
CREATE POLICY "Users can view project tasks in accessible projects" ON public.project_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.courses c ON p.course_id = c.id
            WHERE p.id = project_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers can manage project tasks" ON public.project_tasks
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.courses c ON p.course_id = c.id
            WHERE p.id = project_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Project submissions policies
CREATE POLICY "Students can view their own submissions" ON public.project_submissions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own submissions" ON public.project_submissions
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions" ON public.project_submissions
    FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions in their school" ON public.project_submissions
    FOR SELECT USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.courses c ON p.course_id = c.id
            WHERE p.id = project_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers can update submissions for grading" ON public.project_submissions
    FOR UPDATE USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.courses c ON p.course_id = c.id
            WHERE p.id = project_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Files policies
CREATE POLICY "Users can view files in their school" ON public.files
    FOR SELECT USING (
        school_id = public.get_user_school_id() OR 
        public.get_user_role() = 'superadmin' OR
        is_public = true
    );

CREATE POLICY "Users can upload files to their school" ON public.files
    FOR INSERT WITH CHECK (
        owner_user_id = auth.uid() AND
        school_id = public.get_user_school_id()
    );

CREATE POLICY "Users can update their own files" ON public.files
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON public.files
    FOR DELETE USING (owner_user_id = auth.uid());

-- Enrollments policies
CREATE POLICY "Users can view enrollments in their school" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

CREATE POLICY "Teachers and admins can manage enrollments" ON public.enrollments
    FOR ALL USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id AND 
            (c.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Guardians policies
CREATE POLICY "Parents can view their guardian relationships" ON public.guardians
    FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can manage their guardian relationships" ON public.guardians
    FOR ALL USING (parent_user_id = auth.uid());

CREATE POLICY "Admins can manage guardian relationships in their school" ON public.guardians
    FOR ALL USING (
        public.get_user_role() IN ('school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.user_id = student_user_id AND 
            (p.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Video progress policies
CREATE POLICY "Users can view their own video progress" ON public.video_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own video progress" ON public.video_progress
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Teachers can view video progress in their school" ON public.video_progress
    FOR SELECT USING (
        public.get_user_role() IN ('teacher', 'school_admin', 'superadmin') AND
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.user_id = video_progress.user_id AND 
            (p.school_id = public.get_user_school_id() OR public.get_user_role() = 'superadmin')
        )
    );

-- Create a function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert a basic profile for new user
    -- Role and school_id will be set later by admin
    INSERT INTO public.profiles (user_id, role, full_name, email)
    VALUES (
        NEW.id, 
        'student', -- default role
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for school files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('school-files', 'school-files', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/octet-stream']);

-- Storage policies for school files
CREATE POLICY "Users can view files in their school bucket" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'school-files' AND
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.user_id = auth.uid() AND 
            (storage.foldername(name))[1] = p.school_id::text
        )
    );

CREATE POLICY "Users can upload files to their school folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'school-files' AND
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.user_id = auth.uid() AND 
            (storage.foldername(name))[1] = p.school_id::text
        )
    );

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'school-files' AND
        auth.uid()::text = (storage.foldername(name))[2]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'school-files' AND
        auth.uid()::text = (storage.foldername(name))[2]
    );