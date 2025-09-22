-- إنشاء لعبة جديدة تستخدم المصطلحات الحقيقية من القسم الأول (أساسيات الاتصال)
INSERT INTO pair_matching_games (
  title, 
  description, 
  grade_level, 
  subject, 
  difficulty_level, 
  max_pairs, 
  time_limit_seconds, 
  is_active
) VALUES (
  'مطابقة أساسيات الشبكات والاتصال',
  'لعبة مطابقة تعليمية مستندة إلى المحتوى النصي للقسم الأول من منهج الشبكات',
  '11',
  'networks',
  'easy',
  8,
  300,
  true
);

-- الحصول على معرف اللعبة الجديدة وربطها بالمحتوى التعليمي
WITH new_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة أساسيات الشبكات والاتصال'
  AND created_at >= NOW() - INTERVAL '1 minute'
  LIMIT 1
),
section_data AS (
  SELECT id FROM grade11_sections 
  WHERE title LIKE '%أساسيات الاتصال%' 
  LIMIT 1
)
INSERT INTO grade11_content_games (
  game_id,
  section_id,
  term_selection_criteria,
  auto_generate_pairs,
  is_active
) 
SELECT 
  ng.id,
  sd.id,
  '{"difficulty": ["easy", "medium"], "max_terms": 8}'::jsonb,
  true,
  true
FROM new_game ng
CROSS JOIN section_data sd;

-- إنشاء أزواج المطابقة باستخدام القيم الصحيحة للنوع
WITH new_game AS (
  SELECT id FROM pair_matching_games 
  WHERE title = 'مطابقة أساسيات الشبكات والاتصال'
  AND created_at >= NOW() - INTERVAL '1 minute'
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
  ng.id,
  get.term_text,
  get.definition,
  'text',
  'text',
  get.term_text || ': ' || get.definition,
  ROW_NUMBER() OVER (ORDER BY get.importance_level DESC, get.created_at)
FROM new_game ng
CROSS JOIN grade11_educational_terms get
JOIN grade11_sections gs ON get.section_id = gs.id
WHERE gs.order_index = 1
  AND get.is_approved = true
  AND get.difficulty_level IN ('easy', 'medium')
LIMIT 8;