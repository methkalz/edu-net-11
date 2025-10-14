
-- حذف الـ triggers القديمة إن وجدت
DROP TRIGGER IF EXISTS notify_on_grade12_comment ON grade12_project_comments;
DROP TRIGGER IF EXISTS notify_on_grade10_comment ON grade10_project_comments;

-- إنشاء trigger جديد لإنشاء إشعارات عند إضافة تعليق على مشاريع الصف الثاني عشر
CREATE TRIGGER notify_on_grade12_comment
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();

-- إنشاء trigger جديد لإنشاء إشعارات عند إضافة تعليق على مشاريع الصف العاشر
CREATE TRIGGER notify_on_grade10_comment
  AFTER INSERT ON grade10_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();
