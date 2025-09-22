-- إنشاء لعبة جديدة تستخدم المصطلحات الحقيقية من القسم الأول (أساسيات الاتصال)
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
  'مطابقة أساسيات الشبكات والاتصال',
  'لعبة مطابقة تعليمية مستندة إلى المحتوى النصي للقسم الأول من منهج الشبكات',
  '11',
  'networks',
  'easy',
  8,
  300,
  true
);

-- ربط اللعبة الجديدة بالمحتوى التعليمي (القسم الأول)
INSERT INTO grade11_content_games (
  game_id,
  section_id,
  term_selection_criteria,
  auto_generate_pairs,
  is_active
) 
SELECT 
  pmg.id,
  gs.id,
  '{"difficulty": ["easy", "medium"], "max_terms": 8}'::jsonb,
  true,
  true
FROM pair_matching_games pmg
CROSS JOIN grade11_sections gs
WHERE pmg.title = 'مطابقة أساسيات الشبكات والاتصال'
  AND gs.title LIKE '%أساسيات الاتصال%'
  AND NOT EXISTS (
    SELECT 1 FROM grade11_content_games gcg 
    WHERE gcg.game_id = pmg.id
  );

-- إنشاء أزواج المطابقة من المصطلحات المستخرجة للقسم الأول
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
  pmg.id,
  get.term_text,
  get.definition,
  'term',
  'definition',
  get.term_text || ': ' || get.definition,
  ROW_NUMBER() OVER (ORDER BY get.importance_level DESC, get.created_at)
FROM pair_matching_games pmg
CROSS JOIN grade11_educational_terms get
JOIN grade11_sections gs ON get.section_id = gs.id
WHERE pmg.title = 'مطابقة أساسيات الشبكات والاتصال'
  AND gs.order_index = 1
  AND get.is_approved = true
  AND get.difficulty_level IN ('easy', 'medium')
  AND NOT EXISTS (
    SELECT 1 FROM pair_matching_pairs pmp 
    WHERE pmp.game_id = pmg.id
  )
LIMIT 8;