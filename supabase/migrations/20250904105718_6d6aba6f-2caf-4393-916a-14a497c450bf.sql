-- إنشاء ألعاب متدرجة حسب المنهج الفعلي
INSERT INTO pair_matching_games (
  title, 
  description, 
  grade_level, 
  subject, 
  difficulty_level, 
  max_pairs, 
  time_limit_seconds, 
  is_active
) VALUES 
(
  'أساسيات الشبكات - المستوى الأول',
  'تعلم المفاهيم الأساسية للشبكات والاتصال (أقسام 1-3)',
  '11',
  'networks',
  'easy',
  6,
  240,
  true
),
(
  'البروتوكولات والطبقات - المستوى الثاني',
  'فهم البروتوكولات وطبقات الشبكة (أقسام 4-8)',
  '11',
  'networks',
  'medium',
  8,
  300,
  true
),
(
  'التوجيه والإعدادات المتقدمة - المستوى الثالث',
  'التعمق في التوجيه والإعدادات المتقدمة (أقسام 9-15)',
  '11',
  'networks',
  'hard',
  10,
  360,
  true
),
(
  'الشبكات المتقدمة والأمان - المستوى الرابع',
  'مفاهيم متقدمة في الشبكات والأمان (أقسام 16-22)',
  '11',
  'networks',
  'hard',
  12,
  420,
  true
);

-- ربط الألعاب الجديدة بالأقسام المناسبة
WITH game_section_mapping AS (
  SELECT 
    pmg.id as game_id,
    pmg.title,
    pmg.difficulty_level,
    gs.id as section_id,
    gs.order_index,
    CASE 
      -- المستوى الأول: الأقسام 1-3 (أساسيات)
      WHEN pmg.title LIKE '%المستوى الأول%' AND gs.order_index BETWEEN 1 AND 3 THEN true
      -- المستوى الثاني: الأقسام 4-8 (البروتوكولات والطبقات)
      WHEN pmg.title LIKE '%المستوى الثاني%' AND gs.order_index BETWEEN 4 AND 8 THEN true
      -- المستوى الثالث: الأقسام 9-15 (التوجيه والإعدادات)
      WHEN pmg.title LIKE '%المستوى الثالث%' AND gs.order_index BETWEEN 9 AND 15 THEN true
      -- المستوى الرابع: الأقسام 16-22 (الشبكات المتقدمة)
      WHEN pmg.title LIKE '%المستوى الرابع%' AND gs.order_index BETWEEN 16 AND 22 THEN true
      ELSE false
    END as is_matched
  FROM pair_matching_games pmg
  CROSS JOIN grade11_sections gs
  WHERE pmg.title IN (
    'أساسيات الشبكات - المستوى الأول',
    'البروتوكولات والطبقات - المستوى الثاني', 
    'التوجيه والإعدادات المتقدمة - المستوى الثالث',
    'الشبكات المتقدمة والأمان - المستوى الرابع'
  )
  AND pmg.created_at >= NOW() - INTERVAL '1 minute'
)
INSERT INTO grade11_content_games (
  game_id,
  section_id,
  term_selection_criteria,
  auto_generate_pairs,
  is_active
)
SELECT 
  gsm.game_id,
  gsm.section_id,
  CASE 
    WHEN gsm.difficulty_level = 'easy' THEN '{"difficulty": ["easy"], "max_terms": 6}'::jsonb
    WHEN gsm.difficulty_level = 'medium' THEN '{"difficulty": ["easy", "medium"], "max_terms": 8}'::jsonb
    ELSE '{"difficulty": ["medium", "hard"], "max_terms": 10}'::jsonb
  END,
  true,
  true
FROM game_section_mapping gsm
WHERE gsm.is_matched = true;