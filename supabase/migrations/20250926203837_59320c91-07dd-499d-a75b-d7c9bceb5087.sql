-- Update avatar_images table with new avatar options
INSERT INTO avatar_images (filename, file_path, display_name, category, order_index, is_active) VALUES
-- Student avatars
('student-boy-1.png', '/avatars/student-boy-1.png', 'طالب ودود', 'student', 1, true),
('student-girl-1.png', '/avatars/student-girl-1.png', 'طالبة مرحة', 'student', 2, true),
('student-boy-2.png', '/avatars/student-boy-2.png', 'طالب مجتهد', 'student', 3, true),
('student-girl-2.png', '/avatars/student-girl-2.png', 'طالبة ذكية', 'student', 4, true),
('student-boy-3.png', '/avatars/student-boy-3.png', 'طالب مبدع', 'student', 5, true),
('student-girl-3.png', '/avatars/student-girl-3.png', 'طالبة واثقة', 'student', 6, true),
('student-boy-4.png', '/avatars/student-boy-4.png', 'طالب نشيط', 'student', 7, true),
('student-girl-4.png', '/avatars/student-girl-4.png', 'طالبة متفوقة', 'student', 8, true),
('student-boy-5.png', '/avatars/student-boy-5.png', 'طالب متميز', 'student', 9, true),
('student-girl-5.png', '/avatars/student-girl-5.png', 'طالبة مؤدبة', 'student', 10, true),
('student-creative.png', '/avatars/student-creative.png', 'طالب فنان', 'student', 11, true),

-- Teacher avatars
('teacher-male-1.png', '/avatars/teacher-male-1.png', 'معلم محترف', 'teacher', 1, true),
('teacher-female-1.png', '/avatars/teacher-female-1.png', 'معلمة ودودة', 'teacher', 2, true),
('teacher-male-2.png', '/avatars/teacher-male-2.png', 'معلم شاب', 'teacher', 3, true),
('teacher-female-2.png', '/avatars/teacher-female-2.png', 'معلمة خبيرة', 'teacher', 4, true),
('teacher-female-3.png', '/avatars/teacher-female-3.png', 'معلمة محترمة', 'teacher', 5, true),
('teacher-male-3.png', '/avatars/teacher-male-3.png', 'معلم مرح', 'teacher', 6, true),

-- School admin avatars
('admin-school-male.png', '/avatars/admin-school-male.png', 'مدير مدرسة', 'school_admin', 1, true),
('admin-school-female.png', '/avatars/admin-school-female.png', 'مديرة مدرسة', 'school_admin', 2, true),
('admin-school-formal.png', '/avatars/admin-school-formal.png', 'إداري محترف', 'school_admin', 3, true),

-- Parent avatars
('parent-1.png', '/avatars/parent-1.png', 'ولي أمر مهتم', 'parent', 1, true),
('parent-2.png', '/avatars/parent-2.png', 'ولية أمر داعمة', 'parent', 2, true),

-- Superadmin avatars
('superadmin-1.png', '/avatars/superadmin-1.png', 'مدير النظام الرئيسي', 'superadmin', 1, true),
('superadmin-2.png', '/avatars/superadmin-2.png', 'مدير تقني', 'superadmin', 2, true),

-- Universal avatars
('universal-default.png', '/avatars/universal-default.png', 'أفاتار افتراضي', 'universal', 1, true)

ON CONFLICT (filename) DO UPDATE SET
  file_path = EXCLUDED.file_path,
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;