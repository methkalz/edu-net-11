-- إنشاء أزواج المطابقة للألعاب الجديدة باستخدام المصطلحات الموجودة
WITH new_games AS (
  SELECT 
    id, 
    title, 
    difficulty_level,
    max_pairs
  FROM pair_matching_games 
  WHERE title IN (
    'أساسيات الشبكات - المستوى الأول',
    'البروتوكولات والطبقات - المستوى الثاني',
    'التوجيه والإعدادات المتقدمة - المستوى الثالث',
    'الشبكات المتقدمة والأمان - المستوى الرابع'
  )
  AND created_at >= NOW() - INTERVAL '2 minutes'
),
game_terms AS (
  SELECT 
    ng.id as game_id,
    ng.max_pairs,
    get.term_text,
    get.definition,
    get.importance_level,
    ROW_NUMBER() OVER (
      PARTITION BY ng.id 
      ORDER BY get.importance_level DESC, get.created_at ASC
    ) as term_rank
  FROM new_games ng
  JOIN grade11_content_games gcg ON gcg.game_id = ng.id
  JOIN grade11_educational_terms get ON get.section_id = gcg.section_id
  WHERE get.is_approved = true
    AND get.term_text IS NOT NULL 
    AND get.definition IS NOT NULL
    AND CASE 
      WHEN ng.difficulty_level = 'easy' THEN get.difficulty_level = 'easy'
      WHEN ng.difficulty_level = 'medium' THEN get.difficulty_level IN ('easy', 'medium')
      ELSE get.difficulty_level IN ('medium', 'hard')
    END
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
  gt.game_id,
  gt.term_text,
  gt.definition,
  'text',
  'text',
  'تعريف: ' || gt.term_text,
  gt.term_rank
FROM game_terms gt
WHERE gt.term_rank <= gt.max_pairs;

-- تحديث نظام فتح الألعاب تدريجياً
UPDATE pair_matching_games 
SET updated_at = now()
WHERE title IN (
  'أساسيات الشبكات - المستوى الأول',
  'البروتوكولات والطبقات - المستوى الثاني',
  'التوجيه والإعدادات المتقدمة - المستوى الثالث',
  'الشبكات المتقدمة والأمان - المستوى الرابع'
);