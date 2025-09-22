-- إضافة لعبة جديدة: أنظمة التشغيل
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم أنظمة التشغيل',
  'لعبة تفاعلية لمطابقة المفاهيم الأساسية في أنظمة التشغيل وإدارة الموارد',
  '11',
  'operating_systems',
  'medium',
  5,
  300,
  true
);

-- إضافة أزواج أنظمة التشغيل
WITH new_os_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم أنظمة التشغيل'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_os_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_os_game,
(VALUES
  ('Process', 'عملية قيد التنفيذ في الذاكرة', 'text', 'text', 'برنامج يعمل حالياً ويستهلك موارد النظام', 1),
  ('Thread', 'خيط تنفيذ داخل العملية الواحدة', 'text', 'text', 'يسمح بتنفيذ مهام متعددة بالتوازي', 2),
  ('Kernel', 'نواة النظام التي تدير الموارد', 'text', 'text', 'الجزء الأساسي الذي يتحكم في الأجهزة', 3),
  ('Virtual Memory', 'ذاكرة افتراضية توسع الذاكرة الفيزيائية', 'text', 'text', 'تستخدم القرص الصلب كامتداد للذاكرة', 4),
  ('File System', 'نظام إدارة الملفات على القرص', 'text', 'text', 'ينظم تخزين واسترجاع البيانات', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);

-- إضافة لعبة جديدة: البرمجة الكائنية
INSERT INTO pair_matching_games (
  id,
  title,
  description,
  grade_level,
  subject,
  difficulty_level,
  max_pairs,
  time_limit_seconds,
  is_active
) VALUES (
  gen_random_uuid(),
  'مطابقة مفاهيم البرمجة الكائنية',
  'لعبة تعليمية لمطابقة المفاهيم الأساسية في البرمجة الكائنية التوجه',
  '11',
  'programming',
  'hard',
  5,
  300,
  true
);

-- إضافة أزواج البرمجة الكائنية
WITH new_oop_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة مفاهيم البرمجة الكائنية'
  LIMIT 1
)
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index)
SELECT 
  new_oop_game.id,
  pairs.left_content,
  pairs.right_content,
  pairs.left_type,
  pairs.right_type,
  pairs.explanation,
  pairs.order_index
FROM new_oop_game,
(VALUES
  ('Class', 'قالب أو نموذج لإنشاء كائنات', 'text', 'text', 'يحدد الخصائص والوظائف للكائن', 1),
  ('Object', 'مثيل محدد من الفئة (Class)', 'text', 'text', 'نسخة فعلية تحتوي على بيانات حقيقية', 2),
  ('Inheritance', 'وراثة الخصائص من فئة أبوية', 'text', 'text', 'تسمح بإعادة استخدام الكود وتوسيعه', 3),
  ('Polymorphism', 'تعدد الأشكال في تنفيذ الوظائف', 'text', 'text', 'نفس الوظيفة تعمل بطرق مختلفة', 4),
  ('Encapsulation', 'تغليف البيانات وإخفاء التفاصيل الداخلية', 'text', 'text', 'يحمي البيانات من التلاعب المباشر', 5)
) AS pairs(left_content, right_content, left_type, right_type, explanation, order_index);