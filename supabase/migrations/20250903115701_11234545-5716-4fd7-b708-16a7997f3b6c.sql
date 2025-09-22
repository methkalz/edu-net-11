-- إنشاء جداول المشاريع المصغرة للصف العاشر

-- جدول المشاريع الأساسي
CREATE TABLE IF NOT EXISTS public.grade10_mini_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  student_id UUID NOT NULL,
  school_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'reviewed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- جدول المهام لكل مشروع
CREATE TABLE IF NOT EXISTS public.grade10_project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade10_mini_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول التعليقات والملاحظات
CREATE TABLE IF NOT EXISTS public.grade10_project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade10_mini_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'feedback', 'note')),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الملفات المرفقة
CREATE TABLE IF NOT EXISTS public.grade10_project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.grade10_mini_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  is_image BOOLEAN DEFAULT FALSE,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS على جميع الجداول
ALTER TABLE public.grade10_mini_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade10_project_files ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمشاريع
CREATE POLICY "Students can manage their own projects"
ON public.grade10_mini_projects
FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view school projects"
ON public.grade10_mini_projects
FOR SELECT
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

CREATE POLICY "School admins can manage school projects"
ON public.grade10_mini_projects
FOR ALL
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]))
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- سياسات RLS للمهام
CREATE POLICY "Students can view their project tasks"
ON public.grade10_project_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id AND p.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update their task completion"
ON public.grade10_project_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id AND p.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id AND p.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage project tasks"
ON public.grade10_project_tasks
FOR ALL
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
  AND EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id 
    AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
  )
);

-- سياسات RLS للتعليقات
CREATE POLICY "Project participants can view comments"
ON public.grade10_project_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id 
    AND (
      p.student_id = auth.uid() 
      OR (
        (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
        AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
      )
    )
  )
  AND (is_private = FALSE OR user_id = auth.uid())
);

CREATE POLICY "Project participants can add comments"
ON public.grade10_project_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id 
    AND (
      p.student_id = auth.uid() 
      OR (
        (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
        AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
      )
    )
  )
);

-- سياسات RLS للملفات
CREATE POLICY "Project participants can manage files"
ON public.grade10_project_files
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id 
    AND (
      p.student_id = auth.uid() 
      OR (
        (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
        AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
      )
    )
  )
)
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.grade10_mini_projects p
    WHERE p.id = project_id 
    AND (
      p.student_id = auth.uid() 
      OR (
        (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role]))
        AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
      )
    )
  )
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_grade10_mini_projects_student_id ON public.grade10_mini_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_grade10_mini_projects_school_id ON public.grade10_mini_projects(school_id);
CREATE INDEX IF NOT EXISTS idx_grade10_project_tasks_project_id ON public.grade10_project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_grade10_project_comments_project_id ON public.grade10_project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_grade10_project_files_project_id ON public.grade10_project_files(project_id);

-- إنشاء دالة تحديث التاريخ
CREATE OR REPLACE FUNCTION public.update_grade10_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات للتحديث التلقائي
CREATE TRIGGER update_grade10_mini_projects_updated_at
  BEFORE UPDATE ON public.grade10_mini_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grade10_projects_updated_at();

CREATE TRIGGER update_grade10_project_tasks_updated_at
  BEFORE UPDATE ON public.grade10_project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grade10_projects_updated_at();

CREATE TRIGGER update_grade10_project_comments_updated_at
  BEFORE UPDATE ON public.grade10_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grade10_projects_updated_at();