-- إنشاء جدول المشاريع المصغرة للصف العاشر
CREATE TABLE public.grade10_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed, submitted
  grade INTEGER,
  teacher_feedback TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  school_id UUID NOT NULL,
  created_by UUID NOT NULL
);

-- إنشاء جدول المهام (Tasks) للمشاريع
CREATE TABLE public.grade10_project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade10_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL, -- المعلم الذي أنشأ المهمة
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول ملاحظات المعلم على المشاريع
CREATE TABLE public.grade10_project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade10_projects(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'feedback', -- feedback, revision_request, approval
  created_by UUID NOT NULL, -- المعلم
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تاريخ التعديلات على المشاريع
CREATE TABLE public.grade10_project_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade10_projects(id) ON DELETE CASCADE,
  content_snapshot TEXT NOT NULL,
  revision_note TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.grade10_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_project_revisions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمشاريع
CREATE POLICY "Students can view their own projects" 
ON public.grade10_projects 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can create projects for themselves" 
ON public.grade10_projects 
FOR INSERT 
WITH CHECK (student_id = auth.uid() AND school_id = get_user_school_id());

CREATE POLICY "Students can update their own projects" 
ON public.grade10_projects 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view projects in their school" 
ON public.grade10_projects 
FOR SELECT 
USING ((get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
       AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role));

CREATE POLICY "Teachers can update projects in their school" 
ON public.grade10_projects 
FOR UPDATE 
USING ((get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
       AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role));

-- سياسات الأمان للمهام
CREATE POLICY "Students can view tasks for their projects" 
ON public.grade10_project_tasks 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id AND p.student_id = auth.uid()));

CREATE POLICY "Students can update their task completion status" 
ON public.grade10_project_tasks 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id AND p.student_id = auth.uid()));

CREATE POLICY "Teachers can manage tasks in their school" 
ON public.grade10_project_tasks 
FOR ALL 
USING ((get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
       AND EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id 
                   AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)));

-- سياسات الأمان للتعليقات
CREATE POLICY "Students can view comments on their projects" 
ON public.grade10_project_comments 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id AND p.student_id = auth.uid()));

CREATE POLICY "Teachers can manage comments in their school" 
ON public.grade10_project_comments 
FOR ALL 
USING ((get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
       AND EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id 
                   AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)));

-- سياسات الأمان للمراجعات
CREATE POLICY "Students can view revisions of their projects" 
ON public.grade10_project_revisions 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id AND p.student_id = auth.uid()));

CREATE POLICY "Users can create revisions" 
ON public.grade10_project_revisions 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Teachers can view all revisions in their school" 
ON public.grade10_project_revisions 
FOR SELECT 
USING ((get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
       AND EXISTS (SELECT 1 FROM public.grade10_projects p WHERE p.id = project_id 
                   AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)));

-- إضافة triggers للتحديث التلقائي للتواريخ
CREATE TRIGGER update_grade10_projects_updated_at
BEFORE UPDATE ON public.grade10_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade10_project_tasks_updated_at
BEFORE UPDATE ON public.grade10_project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء indexes للأداء
CREATE INDEX idx_grade10_projects_student_id ON public.grade10_projects(student_id);
CREATE INDEX idx_grade10_projects_school_id ON public.grade10_projects(school_id);
CREATE INDEX idx_grade10_projects_status ON public.grade10_projects(status);
CREATE INDEX idx_grade10_project_tasks_project_id ON public.grade10_project_tasks(project_id);
CREATE INDEX idx_grade10_project_comments_project_id ON public.grade10_project_comments(project_id);
CREATE INDEX idx_grade10_project_revisions_project_id ON public.grade10_project_revisions(project_id);