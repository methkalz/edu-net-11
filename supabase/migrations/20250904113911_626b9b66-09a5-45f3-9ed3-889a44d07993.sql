-- إضافة حقل stage_number ومجال level_number للألعاب
ALTER TABLE pair_matching_games 
ADD COLUMN IF NOT EXISTS stage_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_number INTEGER DEFAULT 1;

-- تحديث الألعاب الحالية لتعكس المستوى والمرحلة
UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 1,
  title = 'المستوى الأول - المرحلة 1'
WHERE title LIKE '%المستوى الأول%';

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 1,
  title = 'المستوى الثاني - المرحلة 1'
WHERE title LIKE '%المستوى الثاني%';

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 1,
  title = 'المستوى الثالث - المرحلة 1'
WHERE title LIKE '%المستوى الثالث%';

UPDATE pair_matching_games SET 
  level_number = 4, 
  stage_number = 1,
  title = 'المستوى الرابع - المرحلة 1'
WHERE title LIKE '%المستوى الرابع%';

-- إنشاء مراحل إضافية للمستوى الأول (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الأول - المرحلة 2', 'مراجعة أساسيات الشبكات - المرحلة الثانية', 'easy', 4, true, 1, 2),
('المستوى الأول - المرحلة 3', 'مراجعة أساسيات الشبكات - المرحلة الثالثة', 'easy', 4, true, 1, 3),
('المستوى الأول - المرحلة 4', 'مراجعة أساسيات الشبكات - المرحلة الأخيرة', 'easy', 4, true, 1, 4);

-- إنشاء مراحل إضافية للمستوى الثاني (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الثاني - المرحلة 2', 'بروتوكولات الشبكة - المرحلة الثانية', 'medium', 5, true, 2, 2),
('المستوى الثاني - المرحلة 3', 'بروتوكولات الشبكة - المرحلة الثالثة', 'medium', 5, true, 2, 3),
('المستوى الثاني - المرحلة 4', 'بروتوكولات الشبكة - المرحلة الأخيرة', 'medium', 5, true, 2, 4);

-- إنشاء مراحل إضافية للمستوى الثالث (3 مراحل إضافية)
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الثالث - المرحلة 2', 'أمان الشبكات - المرحلة الثانية', 'hard', 6, true, 3, 2),
('المستوى الثالث - المرحلة 3', 'أمان الشبكات - المرحلة الثالثة', 'hard', 6, true, 3, 3),
('المستوى الثالث - المرحلة 4', 'أمان الشبكات - المرحلة الأخيرة', 'hard', 6, true, 3, 4);

-- إنشاء مراحل إضافية للمستوى الرابع (3 مراحل إضافية) - تم تصحيح المستوى لـ hard
INSERT INTO pair_matching_games (title, description, difficulty_level, max_pairs, is_active, level_number, stage_number) VALUES
('المستوى الرابع - المرحلة 2', 'إدارة الشبكات المتقدمة - المرحلة الثانية', 'hard', 6, true, 4, 2),
('المستوى الرابع - المرحلة 3', 'إدارة الشبكات المتقدمة - المرحلة الثالثة', 'hard', 6, true, 4, 3),
('المستوى الرابع - المرحلة 4', 'إدارة الشبكات المتقدمة - المرحلة الأخيرة', 'hard', 6, true, 4, 4);