-- إنشاء View مجمع لمحتوى الصف 11 لتحسين الأداء
CREATE OR REPLACE VIEW grade11_student_content_summary AS
SELECT 
  '11' as grade_level,
  (SELECT COUNT(*) FROM grade11_videos WHERE is_active = true AND is_visible = true) as total_videos,
  (SELECT COUNT(*) FROM grade11_documents WHERE is_active = true AND is_visible = true) as total_documents,
  (SELECT COUNT(*) FROM grade11_lessons WHERE is_active = true) as total_lessons,
  (SELECT COUNT(*) FROM grade11_lesson_media WHERE lesson_id IN (SELECT id FROM grade11_lessons WHERE is_active = true)) as total_media;

-- منح صلاحيات القراءة للمستخدمين المصادقين
GRANT SELECT ON grade11_student_content_summary TO authenticated;