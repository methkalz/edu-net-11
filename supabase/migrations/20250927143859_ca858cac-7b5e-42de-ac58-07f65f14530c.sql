-- إضافة ألعاب للصف العاشر مع بيانات مطابقة

-- أولاً: إضافة ألعاب عامة للصف العاشر في جدول games
INSERT INTO games (name, description, grade_level, subject, is_active) VALUES 
('لعبة مطابقة أساسيات الويندوز', 'تعلم أساسيات نظام التشغيل ويندوز من خلال مطابقة المفاهيم والتعريفات', '10', 'windows_basics', true),
('لعبة مطابقة أساسيات الاتصال', 'اكتشف مفاهيم الاتصال الأساسية وكيفية عمل الشبكات', '10', 'communication_basics', true),
('لعبة مطابقة مقدمة الشبكات', 'تعرف على أنواع الشبكات ومكوناتها الأساسية', '10', 'network_intro', true);

-- ثانياً: إضافة ألعاب مطابقة تفصيلية للصف العاشر
INSERT INTO pair_matching_games (
  title, 
  description,
  grade_level, 
  subject, 
  difficulty_level, 
  time_limit_seconds, 
  level_number,
  stage_number,
  max_pairs,
  is_active
) VALUES 
('أساسيات ويندوز - المستوى الأول', 'تعلم المكونات الأساسية لنظام ويندوز', '10', 'windows_basics', 'easy', 300, 1, 1, 8, true),
('أساسيات الاتصال - المستوى الأول', 'فهم مفاهيم الاتصال الأساسية', '10', 'communication_basics', 'easy', 300, 1, 1, 8, true),
('مقدمة الشبكات - المستوى الأول', 'التعرف على أنواع وأساسيات الشبكات', '10', 'network_intro', 'medium', 300, 1, 1, 8, true);