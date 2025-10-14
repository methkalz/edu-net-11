-- إنشاء إشعار للتعليق الجديد
INSERT INTO teacher_notifications (
  teacher_id,
  project_id,
  comment_id,
  notification_type,
  title,
  message,
  is_read
)
VALUES (
  'a0bd32dd-dfe0-40fd-b9e5-f7eaaf5fce2b',
  'eef1fd0a-7140-4097-aa7e-39cea5276924',
  '4000da46-0eff-49ce-a5f4-4fc78f24a10b',
  'student_comment',
  'تعليق جديد من طالب',
  'كريم مراد أضاف تعليقاً على مشروع "مشروع كريم مراد"',
  false
)
ON CONFLICT DO NOTHING;