-- إضافة أفاتار جديدة لفئات الشخصيات والثلاثية الأبعاد والحيوانات

-- فئة الشخصيات المهنية (characters)
INSERT INTO avatar_images (display_name, file_path, filename, category, order_index, is_active) VALUES
('رجل أعمال', '/avatars/businessman-1.png', 'businessman-1.png', 'characters', 1, true),
('امرأة أعمال', '/avatars/businesswoman-1.png', 'businesswoman-1.png', 'characters', 2, true),
('طبيب', '/avatars/doctor-male.png', 'doctor-male.png', 'characters', 3, true),
('ممرضة', '/avatars/nurse-female.png', 'nurse-female.png', 'characters', 4, true),
('مهندس', '/avatars/engineer-male.png', 'engineer-male.png', 'characters', 5, true),
('مهندسة', '/avatars/engineer-female.png', 'engineer-female.png', 'characters', 6, true),
('فنان', '/avatars/artist-male.png', 'artist-male.png', 'characters', 7, true),
('فنانة', '/avatars/artist-female.png', 'artist-female.png', 'characters', 8, true);

-- فئة الأفاتار ثلاثية الأبعاد (3d)
INSERT INTO avatar_images (display_name, file_path, filename, category, order_index, is_active) VALUES
('شخصية ثلاثية أزرق', '/avatars/3d-character-blue.png', '3d-character-blue.png', '3d', 1, true),
('شخصية ثلاثية وردية', '/avatars/3d-character-pink.png', '3d-character-pink.png', '3d', 2, true),
('شخصية ثلاثية خضراء', '/avatars/3d-character-green.png', '3d-character-green.png', '3d', 3, true),
('شخصية ثلاثية برتقالية', '/avatars/3d-character-orange.png', '3d-character-orange.png', '3d', 4, true),
('شخصية ثلاثية بنفسجية', '/avatars/3d-character-purple.png', '3d-character-purple.png', '3d', 5, true),
('شخصية ثلاثية ذهبية', '/avatars/3d-character-gold.png', '3d-character-gold.png', '3d', 6, true);

-- فئة الحيوانات (animals)
INSERT INTO avatar_images (display_name, file_path, filename, category, order_index, is_active) VALUES
('قطة لطيفة', '/avatars/cat-cute.png', 'cat-cute.png', 'animals', 1, true),
('كلب ودود', '/avatars/dog-friendly.png', 'dog-friendly.png', 'animals', 2, true),
('أرنب مرح', '/avatars/rabbit-happy.png', 'rabbit-happy.png', 'animals', 3, true),
('أسد شجاع', '/avatars/lion-brave.png', 'lion-brave.png', 'animals', 4, true),
('نمر قوي', '/avatars/tiger-strong.png', 'tiger-strong.png', 'animals', 5, true),
('دب لطيف', '/avatars/bear-cute.png', 'bear-cute.png', 'animals', 6, true),
('طائر ملون', '/avatars/bird-colorful.png', 'bird-colorful.png', 'animals', 7, true),
('سمكة ذهبية', '/avatars/fish-golden.png', 'fish-golden.png', 'animals', 8, true),
('فراشة جميلة', '/avatars/butterfly-beautiful.png', 'butterfly-beautiful.png', 'animals', 9, true),
('باندا ودود', '/avatars/panda-friendly.png', 'panda-friendly.png', 'animals', 10, true);

-- فئة عالمية (universal) - متاحة لجميع الأدوار
INSERT INTO avatar_images (display_name, file_path, filename, category, order_index, is_active) VALUES
('شخصية عالمية 1', '/avatars/universal-1.png', 'universal-1.png', 'universal', 1, true),
('شخصية عالمية 2', '/avatars/universal-2.png', 'universal-2.png', 'universal', 2, true),
('شخصية عالمية 3', '/avatars/universal-3.png', 'universal-3.png', 'universal', 3, true),
('شخصية عالمية 4', '/avatars/universal-4.png', 'universal-4.png', 'universal', 4, true),
('رمز النجاح', '/avatars/success-icon.png', 'success-icon.png', 'universal', 5, true),
('رمز الإبداع', '/avatars/creativity-icon.png', 'creativity-icon.png', 'universal', 6, true);