-- إضافة الأفاتار الجديدة المطلوبة لنظام handle_new_user
INSERT INTO avatar_images (category, display_name, filename, file_path, order_index, is_active) VALUES
('student', 'طالب 1', 'student1.png', 'student1.png', 1, true),
('student', 'طالب 2', 'student2.png', 'student2.png', 2, true), 
('student', 'طالب 3', 'student3.png', 'student3.png', 3, true),
('student', 'طالب 4', 'student4.png', 'student4.png', 4, true),
('student', 'طالب 5', 'student5.png', 'student5.png', 5, true),
('universal', 'باحث متميز', 'scholar.png', 'scholar.png', 6, true),
('universal', 'خبير أستاذ', 'master.png', 'master.png', 7, true)
ON CONFLICT (filename) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  file_path = EXCLUDED.file_path,
  is_active = EXCLUDED.is_active;

-- تحديث جميع الـ profiles الحالية لاستخدام النظام الجديد الموحد
UPDATE profiles 
SET avatar_url = CASE 
  WHEN avatar_url = 'student-boy-1.png' OR avatar_url = '/avatars/student-boy-1.png' THEN 'student1.png'
  WHEN avatar_url = 'student-girl-1.png' OR avatar_url = '/avatars/student-girl-1.png' THEN 'student2.png'
  WHEN avatar_url = 'students-boy-1.png' THEN 'student3.png'
  WHEN avatar_url = 'students-girl-1.png' THEN 'student4.png'
  ELSE avatar_url
END
WHERE avatar_url IS NOT NULL;