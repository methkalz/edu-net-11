-- إنشاء إشعار للمعلم إياد مراد عن تعليق كريم مراد السابق
INSERT INTO teacher_notifications (
  teacher_id,
  project_id,
  comment_id,
  notification_type,
  title,
  message,
  is_read,
  created_at
)
VALUES (
  'a0bd32dd-dfe0-40fd-b9e5-f7eaaf5fce2b', -- إياد مراد  
  'eef1fd0a-7140-4097-aa7e-39cea5276924', -- مشروع كريم مراد
  '6b1f51c6-a610-4e26-b73d-c8b2085f9713', -- التعليق
  'student_comment',
  'تعليق جديد من طالب',
  'كريم مراد أضاف تعليقاً على مشروع "مشروع كريم مراد"',
  false,
  '2025-10-14 20:48:30.645477+00'
)
ON CONFLICT DO NOTHING;