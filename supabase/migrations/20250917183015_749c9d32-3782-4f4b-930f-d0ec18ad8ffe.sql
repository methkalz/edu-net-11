-- إنشاء RLS policies مبسطة جداً للاختبار - تسمح لجميع المستخدمين المسجلين دخول

-- حذف جميع الـ policies الحالية
DROP POLICY IF EXISTS "allow_insert_comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "allow_select_comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "allow_update_own_comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "allow_delete_own_comments" ON grade12_project_comments;
DROP POLICY IF EXISTS "Students can add comments to their projects" ON grade12_project_comments;
DROP POLICY IF EXISTS "Teachers can add comments to school projects" ON grade12_project_comments;  
DROP POLICY IF EXISTS "Teachers can manage comments in their school" ON grade12_project_comments;
DROP POLICY IF EXISTS "Teachers can mark comments as read" ON grade12_project_comments;
DROP POLICY IF EXISTS "students_manage_own_comments_v2" ON grade12_project_comments;
DROP POLICY IF EXISTS "students_view_their_project_comments_v2" ON grade12_project_comments;
DROP POLICY IF EXISTS "teachers_manage_school_comments_v2" ON grade12_project_comments;

-- Policy بسيط جداً - أي مستخدم مسجل دخول يمكنه إضافة تعليقات
CREATE POLICY "simple_insert_test" 
ON grade12_project_comments 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy بسيط جداً - أي مستخدم مسجل دخول يمكنه رؤية جميع التعليقات
CREATE POLICY "simple_select_test" 
ON grade12_project_comments 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy بسيط جداً - أي مستخدم مسجل دخول يمكنه تحديث أي تعليق
CREATE POLICY "simple_update_test" 
ON grade12_project_comments 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');