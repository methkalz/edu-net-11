-- حذف وإعادة إنشاء الـ triggers
DROP TRIGGER IF EXISTS notify_on_grade12_comment ON grade12_project_comments CASCADE;
DROP TRIGGER IF EXISTS notify_on_grade10_comment ON grade10_project_comments CASCADE;

CREATE TRIGGER notify_on_grade12_comment
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();

CREATE TRIGGER notify_on_grade10_comment
  AFTER INSERT ON grade10_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notifications();