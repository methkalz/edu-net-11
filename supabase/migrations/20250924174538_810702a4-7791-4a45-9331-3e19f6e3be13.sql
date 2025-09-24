-- إصلاح البيانات الحالية التي تحتوي على blob URLs في جدول grade11_lesson_media
-- حذف الصور التي تحتوي على blob URLs حيث أنها غير صالحة ولا يمكن استخدامها
DELETE FROM grade11_lesson_media 
WHERE media_type = 'image' 
  AND file_path LIKE 'blob:%';

-- إضافة تعليق للجدول
COMMENT ON TABLE grade11_lesson_media IS 'جدول وسائط دروس الصف الحادي عشر - تم حذف blob URLs غير الصالحة في 2024-09-24';