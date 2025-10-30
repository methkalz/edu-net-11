-- إنشاء View للإحصائيات السريعة (بدون is_active في sections)
CREATE OR REPLACE VIEW grade11_content_stats AS
SELECT 
  (SELECT COUNT(*) FROM grade11_sections) as total_sections,
  (SELECT COUNT(*) FROM grade11_topics) as total_topics,
  (SELECT COUNT(*) FROM grade11_lessons) as total_lessons,
  (SELECT COUNT(*) FROM grade11_lesson_media) as total_media,
  (SELECT COUNT(*) FROM grade11_videos WHERE is_active = true AND is_visible = true) as total_videos;

-- السماح بقراءة الإحصائيات للطلاب
GRANT SELECT ON grade11_content_stats TO authenticated;