-- إنشاء trigger بسيط للإشعارات
CREATE OR REPLACE TRIGGER notify_project_participants_trigger
  AFTER INSERT ON grade12_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_participants();