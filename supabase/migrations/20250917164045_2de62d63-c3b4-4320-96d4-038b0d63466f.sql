-- إصلاح التحذيرات الأمنية وإضافة search_path للدوال

-- إصلاح دالة get_current_user_id مع SET search_path 
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- إصلاح دالة get_current_user_role_safe مع SET search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT COALESCE(role::text, 'student') FROM public.profiles WHERE user_id = auth.uid();
$$;

-- إصلاح دالة get_current_user_school_id مع SET search_path
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- إصلاح دالة update_professional_documents_updated_at مع SET search_path
CREATE OR REPLACE FUNCTION public.update_professional_documents_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_saved_at = now();
  
  -- حساب عدد الكلمات إذا كان هناك نص
  IF NEW.plain_text IS NOT NULL THEN
    NEW.word_count = array_length(string_to_array(trim(NEW.plain_text), ' '), 1);
    -- حساب عدد الصفحات (تقريبي: 250 كلمة لكل صفحة)
    NEW.page_count = GREATEST(1, CEIL(NEW.word_count::numeric / 250));
  END IF;
  
  RETURN NEW;
END;
$$;

-- إضافة policies لجداول أخرى التي قد تحتاج إليها للمشروع

-- التأكد من وجود جدول grade12_project_notifications
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade12_project_notifications') THEN
        CREATE TABLE public.grade12_project_notifications (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id UUID NOT NULL,
            user_id UUID NOT NULL,
            notification_type TEXT NOT NULL DEFAULT 'comment',
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            
            CONSTRAINT fk_grade12_project_notifications_project FOREIGN KEY (project_id) REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
            CONSTRAINT fk_grade12_project_notifications_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
        );
        
        -- فهارس لتحسين الأداء
        CREATE INDEX idx_grade12_project_notifications_project_id ON public.grade12_project_notifications(project_id);
        CREATE INDEX idx_grade12_project_notifications_user_id ON public.grade12_project_notifications(user_id);
        CREATE INDEX idx_grade12_project_notifications_is_read ON public.grade12_project_notifications(is_read);
        
        -- تفعيل RLS
        ALTER TABLE public.grade12_project_notifications ENABLE ROW LEVEL SECURITY;
        
        -- سياسات RLS آمنة
        CREATE POLICY "المستخدمون يمكنهم رؤية إشعاراتهم فقط" 
        ON public.grade12_project_notifications FOR SELECT 
        USING (user_id = auth.uid());
        
        CREATE POLICY "النظام يمكنه إضافة الإشعارات" 
        ON public.grade12_project_notifications FOR INSERT 
        WITH CHECK (true);
        
        CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" 
        ON public.grade12_project_notifications FOR UPDATE 
        USING (user_id = auth.uid()) 
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

-- التأكد من وجود جدول grade12_project_comments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade12_project_comments') THEN
        CREATE TABLE public.grade12_project_comments (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id UUID NOT NULL,
            user_id UUID NOT NULL,
            comment_text TEXT NOT NULL,
            comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'feedback', 'grade')),
            is_private BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            
            CONSTRAINT fk_grade12_project_comments_project FOREIGN KEY (project_id) REFERENCES grade12_final_projects(id) ON DELETE CASCADE,
            CONSTRAINT fk_grade12_project_comments_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
        );
        
        -- فهارس لتحسين الأداء
        CREATE INDEX idx_grade12_project_comments_project_id ON public.grade12_project_comments(project_id);
        CREATE INDEX idx_grade12_project_comments_user_id ON public.grade12_project_comments(user_id);
        CREATE INDEX idx_grade12_project_comments_created_at ON public.grade12_project_comments(created_at);
        
        -- تفعيل RLS
        ALTER TABLE public.grade12_project_comments ENABLE ROW LEVEL SECURITY;
        
        -- سياسات RLS آمنة
        CREATE POLICY "أطراف المشروع يمكنهم رؤية التعليقات" 
        ON public.grade12_project_comments FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM grade12_final_projects p 
                WHERE p.id = grade12_project_comments.project_id 
                AND (
                    p.student_id = auth.uid() 
                    OR EXISTS (
                        SELECT 1 FROM profiles pr 
                        WHERE pr.user_id = auth.uid() 
                        AND pr.role IN ('teacher', 'school_admin', 'superadmin')
                        AND (pr.school_id = p.school_id OR pr.role = 'superadmin')
                    )
                )
            )
        );
        
        CREATE POLICY "أطراف المشروع يمكنهم إضافة تعليقات" 
        ON public.grade12_project_comments FOR INSERT 
        WITH CHECK (
            user_id = auth.uid() AND
            EXISTS (
                SELECT 1 FROM grade12_final_projects p 
                WHERE p.id = grade12_project_comments.project_id 
                AND (
                    p.student_id = auth.uid() 
                    OR EXISTS (
                        SELECT 1 FROM profiles pr 
                        WHERE pr.user_id = auth.uid() 
                        AND pr.role IN ('teacher', 'school_admin', 'superadmin')
                        AND (pr.school_id = p.school_id OR pr.role = 'superadmin')
                    )
                )
            )
        );
        
        CREATE POLICY "أصحاب التعليقات يمكنهم تحديثها" 
        ON public.grade12_project_comments FOR UPDATE 
        USING (user_id = auth.uid()) 
        WITH CHECK (user_id = auth.uid());
        
        -- إنشاء trigger لتحديث updated_at
        CREATE OR REPLACE FUNCTION update_grade12_project_comments_updated_at()
        RETURNS TRIGGER 
        LANGUAGE plpgsql 
        SET search_path = public
        AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$;
        
        CREATE TRIGGER update_grade12_project_comments_updated_at
        BEFORE UPDATE ON public.grade12_project_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_grade12_project_comments_updated_at();
        
        -- إنشاء trigger للإشعارات
        CREATE OR REPLACE FUNCTION create_grade12_project_comment_notification()
        RETURNS TRIGGER 
        LANGUAGE plpgsql 
        SET search_path = public
        AS $$
        BEGIN
            -- إضافة إشعار للطالب إذا كان المعلق معلماً
            IF EXISTS (
                SELECT 1 FROM profiles 
                WHERE user_id = NEW.user_id 
                AND role IN ('teacher', 'school_admin', 'superadmin')
            ) THEN
                INSERT INTO grade12_project_notifications (project_id, user_id, notification_type, message)
                SELECT NEW.project_id, p.student_id, 'teacher_comment', 'تعليق جديد من المعلم على مشروعك'
                FROM grade12_final_projects p 
                WHERE p.id = NEW.project_id AND p.student_id != NEW.user_id;
            END IF;
            
            -- إضافة إشعار للمعلم إذا كان المعلق طالباً
            IF EXISTS (
                SELECT 1 FROM profiles 
                WHERE user_id = NEW.user_id 
                AND role = 'student'
            ) THEN
                INSERT INTO grade12_project_notifications (project_id, user_id, notification_type, message)
                SELECT NEW.project_id, pr.user_id, 'student_comment', 'تعليق جديد من الطالب على المشروع'
                FROM grade12_final_projects p
                JOIN profiles pr ON pr.school_id = p.school_id AND pr.role IN ('teacher', 'school_admin')
                WHERE p.id = NEW.project_id AND pr.user_id != NEW.user_id;
            END IF;
            
            RETURN NEW;
        END;
        $$;
        
        CREATE TRIGGER create_grade12_project_comment_notification
        AFTER INSERT ON public.grade12_project_comments
        FOR EACH ROW
        EXECUTE FUNCTION create_grade12_project_comment_notification();
    END IF;
END
$$;