-- إنشاء trigger للإشعارات على grade12_project_comments
-- التأكد من عدم وجود trigger قديم أولاً
DROP TRIGGER IF EXISTS notify_project_participants_trigger ON grade12_project_comments;

-- إنشاء trigger جديد
CREATE TRIGGER notify_project_participants_trigger
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_participants();