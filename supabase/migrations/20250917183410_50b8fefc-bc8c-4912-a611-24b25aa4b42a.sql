-- إزالة الـ trigger والـ function القديم الذي يسبب المشكلة
DROP TRIGGER IF EXISTS create_teacher_notification_trigger ON grade12_project_comments;
DROP FUNCTION IF EXISTS create_teacher_notification();

-- التأكد من أن الـ trigger الصحيح موجود (notify_project_participants_trigger)
-- لا نحتاج لإعادة إنشاؤه لأنه موجود بالفعل ويستخدم NEW.created_by بشكل صحيح