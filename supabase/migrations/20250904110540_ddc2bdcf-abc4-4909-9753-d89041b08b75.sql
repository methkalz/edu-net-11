-- إنشاء أزواج المطابقة للألعاب الجديدة التي لا تحتوي على أزواج
-- أولاً: إنشاء أزواج للمستوى الأول (أساسيات الشبكات)
WITH level1_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'أساسيات الشبكات - المستوى الأول'
  AND is_active = true
  LIMIT 1
)
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
)
SELECT 
  lg.id,
  get.term_text,
  get.definition,
  'text',
  'text',
  'تعريف: ' || get.term_text,
  ROW_NUMBER() OVER (ORDER BY get.importance_level DESC, get.created_at)
FROM level1_game lg
CROSS JOIN grade11_educational_terms get
JOIN grade11_sections gs ON get.section_id = gs.id
WHERE gs.order_index BETWEEN 1 AND 3
  AND get.is_approved = true
  AND get.difficulty_level = 'easy'
  AND get.term_text IS NOT NULL 
  AND get.definition IS NOT NULL
LIMIT 6;

-- إنشاء أزواج للمستوى الثاني (البروتوكولات والطبقات)
WITH level2_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'البروتوكولات والطبقات - المستوى الثاني'
  AND is_active = true
  LIMIT 1
)
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
)
SELECT 
  lg.id,
  get.term_text,
  get.definition,
  'text',
  'text',
  'تعريف: ' || get.term_text,
  ROW_NUMBER() OVER (ORDER BY get.importance_level DESC, get.created_at)
FROM level2_game lg
CROSS JOIN grade11_educational_terms get
JOIN grade11_sections gs ON get.section_id = gs.id
WHERE gs.order_index BETWEEN 4 AND 8
  AND get.is_approved = true
  AND get.difficulty_level IN ('easy', 'medium')
  AND get.term_text IS NOT NULL 
  AND get.definition IS NOT NULL
LIMIT 8;

-- إنشاء أزواج للمستوى الثالث (التوجيه والإعدادات المتقدمة)
WITH level3_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'التوجيه والإعدادات المتقدمة - المستوى الثالث'
  AND is_active = true
  LIMIT 1
)
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
)
SELECT 
  lg.id,
  get.term_text,
  get.definition,
  'text',
  'text',
  'تعريف: ' || get.term_text,
  ROW_NUMBER() OVER (ORDER BY get.importance_level DESC, get.created_at)
FROM level3_game lg
CROSS JOIN grade11_educational_terms get
JOIN grade11_sections gs ON get.section_id = gs.id
WHERE gs.order_index BETWEEN 9 AND 15
  AND get.is_approved = true
  AND get.difficulty_level IN ('medium', 'hard')
  AND get.term_text IS NOT NULL 
  AND get.definition IS NOT NULL
LIMIT 10;

-- إنشاء أزواج للمستوى الرابع (الشبكات المتقدمة والأمان)
WITH level4_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'الشبكات المتقدمة والأمان - المستوى الرابع'
  AND is_active = true
  LIMIT 1
)
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
)
SELECT 
  lg.id,
  get.term_text,
  get.definition,
  'text',
  'text',
  'تعريف: ' || get.term_text,
  ROW_NUMBER() OVER (ORDER BY get.importance_level DESC, get.created_at)
FROM level4_game lg
CROSS JOIN grade11_educational_terms get
JOIN grade11_sections gs ON get.section_id = gs.id
WHERE gs.order_index BETWEEN 16 AND 22
  AND get.is_approved = true
  AND get.difficulty_level = 'hard'
  AND get.term_text IS NOT NULL 
  AND get.definition IS NOT NULL
LIMIT 12; 