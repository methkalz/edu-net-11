-- إنشاء جداول نظام المشاريع النهائية للصف الثاني عشر

-- إنشاء جدول المشاريع النهائية
CREATE TABLE public.grade12_final_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  grade INTEGER,
  teacher_feedback TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  school_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مهام المشروع (مع دعم الهرمية)
CREATE TABLE public.grade12_project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.grade12_final_projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.grade12_project_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL DEFAULT 0,
  task_type TEXT NOT NULL DEFAULT 'main',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تعليقات المشروع
CREATE TABLE public.grade12_project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade12_final_projects(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'feedback',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مراجعات المشروع
CREATE TABLE public.grade12_project_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade12_final_projects(id) ON DELETE CASCADE,
  content_snapshot TEXT NOT NULL,
  revision_note TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تحديث جدول grade12_videos بالحقول المطلوبة
ALTER TABLE public.grade12_videos 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT ARRAY['all'],
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'youtube';

-- تحديث جدول grade12_documents بالحقول المطلوبة  
ALTER TABLE public.grade12_documents 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'materials',
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT ARRAY['all'],
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- تفعيل RLS على جميع الجداول الجديدة
ALTER TABLE public.grade12_final_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_project_revisions ENABLE ROW LEVEL SECURITY;

-- إنشاء RLS policies للمشاريع النهائية
CREATE POLICY "Students can view their own final projects" 
ON public.grade12_final_projects 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can create final projects for themselves" 
ON public.grade12_final_projects 
FOR INSERT 
WITH CHECK (student_id = auth.uid() AND school_id = get_user_school_id());

CREATE POLICY "Students can update their own final projects" 
ON public.grade12_final_projects 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view final projects in their school" 
ON public.grade12_final_projects 
FOR SELECT 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND 
  (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "Teachers can update final projects in their school" 
ON public.grade12_final_projects 
FOR UPDATE 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND 
  (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- إنشاء RLS policies لمهام المشروع
CREATE POLICY "Students can view tasks for their projects" 
ON public.grade12_project_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_tasks.project_id AND p.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update task completion status" 
ON public.grade12_project_tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_tasks.project_id AND p.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage tasks in their school" 
ON public.grade12_project_tasks 
FOR ALL 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND 
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_tasks.project_id AND 
    (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- إنشاء RLS policies لتعليقات المشروع
CREATE POLICY "Students can view comments on their projects" 
ON public.grade12_project_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_comments.project_id AND p.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage comments in their school" 
ON public.grade12_project_comments 
FOR ALL 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND 
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_comments.project_id AND 
    (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- إنشاء RLS policies لمراجعات المشروع
CREATE POLICY "Students can view revisions of their projects" 
ON public.grade12_project_revisions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_revisions.project_id AND p.student_id = auth.uid()
  )
);

CREATE POLICY "Users can create revisions" 
ON public.grade12_project_revisions 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Teachers can view all revisions in their school" 
ON public.grade12_project_revisions 
FOR SELECT 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]) AND 
  EXISTS (
    SELECT 1 FROM public.grade12_final_projects p 
    WHERE p.id = grade12_project_revisions.project_id AND 
    (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- إنشاء triggers للتحديث التلقائي للتواريخ
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grade12_final_projects_updated_at
BEFORE UPDATE ON public.grade12_final_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade12_project_tasks_updated_at
BEFORE UPDATE ON public.grade12_project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();