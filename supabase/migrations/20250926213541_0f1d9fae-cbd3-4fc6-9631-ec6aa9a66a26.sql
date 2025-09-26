-- إضافة مجموعة أفاتارات الطلاب الجديدة
INSERT INTO public.avatar_images (
  file_path, 
  filename, 
  display_name, 
  category, 
  order_index, 
  is_active
) VALUES 
  -- أفاتارات الطلاب المتنوعة
  ('students-boy-1.png', 'students-boy-1.png', 'طالب 1', 'student', 1, true),
  ('students-girl-1.png', 'students-girl-1.png', 'طالبة 1', 'student', 2, true),
  ('students-boy-2.png', 'students-boy-2.png', 'طالب 2', 'student', 3, true),
  ('students-boy-3.png', 'students-boy-3.png', 'طالب 3', 'student', 4, true),
  ('students-girl-2.png', 'students-girl-2.png', 'طالبة 2', 'student', 5, true),
  ('students-boy-4.png', 'students-boy-4.png', 'طالب 4', 'student', 6, true),
  ('students-boy-5.png', 'students-boy-5.png', 'طالب 5', 'student', 7, true),
  ('students-girl-3.png', 'students-girl-3.png', 'طالبة 3', 'student', 8, true),
  ('students-boy-6.png', 'students-boy-6.png', 'طالب 6', 'student', 9, true);