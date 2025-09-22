-- إزالة صلاحيات التعديل للمعلمين من جداول المضامين وتقييدها للمدراء فقط

-- تعديل صلاحيات grade10_videos
DROP POLICY IF EXISTS "Teachers can manage grade 10 videos" ON grade10_videos;

CREATE POLICY "School admins can manage grade 10 videos" 
ON grade10_videos 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
  AND ((school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
);

-- تعديل صلاحيات grade10_documents  
DROP POLICY IF EXISTS "Teachers can manage grade 10 documents" ON grade10_documents;

CREATE POLICY "School admins can manage grade 10 documents" 
ON grade10_documents 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
  AND ((school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
);

-- تعديل صلاحيات grade12_videos
DROP POLICY IF EXISTS "Teachers can manage grade 12 videos" ON grade12_videos;

CREATE POLICY "School admins can manage grade 12 videos" 
ON grade12_videos 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
  AND ((school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
);

-- تعديل صلاحيات grade12_documents
DROP POLICY IF EXISTS "Teachers can manage grade 12 documents" ON grade12_documents;

CREATE POLICY "School admins can manage grade 12 documents" 
ON grade12_documents 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
  AND ((school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role))
);

-- تعديل صلاحيات lessons لتكون للقراءة فقط للمعلمين
-- (يبدو أن جدول lessons فقط للقراءة بالفعل للمعلمين)

-- تعديل صلاحيات exams لتقييدها للمدراء فقط  
DROP POLICY IF EXISTS "Teachers can manage exams in their school" ON exams;

CREATE POLICY "School admins can manage exams in their school" 
ON exams 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
  AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = exams.course_id) AND ((c.school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role)))))
);

-- تعديل صلاحيات projects لتقييدها للمدراء فقط
DROP POLICY IF EXISTS "Teachers can manage projects in their school" ON projects;

CREATE POLICY "School admins can manage projects in their school" 
ON projects 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role])) 
  AND (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = projects.course_id) AND ((c.school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role)))))
);