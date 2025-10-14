-- 1. إضافة RLS policy للسماح بـ INSERT من SECURITY DEFINER functions
CREATE POLICY "Allow insert from security definer functions"
ON teacher_notifications
FOR INSERT
WITH CHECK (true);

-- 2. حذف الـ triggers القديمة إن وجدت
DROP TRIGGER IF EXISTS notify_on_grade12_comment ON grade12_project_comments;
DROP TRIGGER IF EXISTS notify_on_grade10_comment ON grade10_project_comments;

-- 3. إنشاء triggers جديدة
CREATE TRIGGER notify_on_grade12_comment
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();

CREATE TRIGGER notify_on_grade10_comment
  AFTER INSERT ON grade10_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();