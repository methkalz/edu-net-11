-- حذف الألعاب غير المناسبة (جميع الألعاب عدا اللعبة الصحيحة الجديدة)
-- أولاً حذف أزواج المطابقة للألعاب غير المناسبة
DELETE FROM pair_matching_pairs 
WHERE game_id IN (
  SELECT id FROM pair_matching_games 
  WHERE title != 'مطابقة أساسيات الشبكات والاتصال'
  AND is_active = true
);

-- حذف تقدم اللاعبين للألعاب غير المناسبة
DELETE FROM player_game_progress 
WHERE game_id IN (
  SELECT id FROM pair_matching_games 
  WHERE title != 'مطابقة أساسيات الشبكات والاتصال'
  AND is_active = true
);

-- حذف ربط الألعاب بالمحتوى للألعاب غير المناسبة
DELETE FROM grade11_content_games 
WHERE game_id IN (
  SELECT id FROM pair_matching_games 
  WHERE title != 'مطابقة أساسيات الشبكات والاتصال'
  AND is_active = true
);

-- إلغاء تفعيل الألعاب غير المناسبة بدلاً من حذفها لحفظ السجلات
UPDATE pair_matching_games 
SET is_active = false, 
    updated_at = now()
WHERE title != 'مطابقة أساسيات الشبكات والاتصال'
AND is_active = true;

-- إنشاء ألعاب متدرجة حسب المنهج الفعلي
-- اللعبة الأولى: أساسيات الاتصال (القسم الأول) - سهل
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
  'تعلم المفاهيم الأساسية للشبكات والاتصال',
  '11',
  'networks',
  'easy',
  6,
  240,
  true
),
(
  'البروتوكولات والنماذج - المستوى الثاني',
  'فهم البروتوكولات الأساسية ونموذج OSI',
  '11',
  'networks',
  'medium',
  8,
  300,
  true
),
(
  'طبقات الشبكة المتقدمة - المستوى الثالث',
  'التعمق في طبقات الشبكة والتوجيه',
  '11',
  'networks',
  'hard',
  10,
  360,
  true
);

-- ربط الألعاب الجديدة بالأقسام المناسبة
WITH games_sections AS (
  SELECT 
    pmg.id as game_id,
    gs.id as section_id,
    CASE 
      WHEN pmg.title LIKE '%المستوى الأول%' THEN gs.id
      WHEN pmg.title LIKE '%المستوى الثاني%' AND gs.order_index <= 6 THEN gs.id
      WHEN pmg.title LIKE '%المستوى الثالث%' AND gs.order_index >= 7 THEN gs.id
      ELSE NULL
    END as matched_section
  FROM pair_matching_games pmg
  CROSS JOIN grade11_sections gs
  WHERE pmg.title IN (
    'أساسيات الشبكات - المستوى الأول',
    'البروتوكولات والنماذج - المستوى الثاني', 
    'طبقات الشبكة المتقدمة - المستوى الثالث'
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
SELECT DISTINCT
  gs.game_id,
  gs.section_id,
  CASE 
    WHEN EXISTS(SELECT 1 FROM pair_matching_games pmg WHERE pmg.id = gs.game_id AND pmg.difficulty_level = 'easy')
    THEN '{"difficulty": ["easy"], "max_terms": 6}'::jsonb
    WHEN EXISTS(SELECT 1 FROM pair_matching_games pmg WHERE pmg.id = gs.game_id AND pmg.difficulty_level = 'medium')
    THEN '{"difficulty": ["easy", "medium"], "max_terms": 8}'::jsonb
    ELSE '{"difficulty": ["medium", "hard"], "max_terms": 10}'::jsonb
  END,
  true,
  true
FROM games_sections gs
WHERE gs.matched_section IS NOT NULL;

-- إنشاء أزواج المطابقة للألعاب الجديدة باستخدام المصطلحات الموجودة
WITH new_games AS (
  SELECT id, title, difficulty_level FROM pair_matching_games 
  WHERE title IN (
    'أساسيات الشبكات - المستوى الأول',
    'البروتوكولات والنماذج - المستوى الثاني',
    'طبقات الشبكة المتقدمة - المستوى الثالث'
  )
  AND created_at >= NOW() - INTERVAL '1 minute'
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
  'تعريف: ' || get.term_text,
  ROW_NUMBER() OVER (PARTITION BY ng.id ORDER BY get.importance_level DESC, get.created_at)
FROM new_games ng
JOIN grade11_content_games gcg ON gcg.game_id = ng.id
JOIN grade11_educational_terms get ON get.section_id = gcg.section_id
WHERE get.is_approved = true
  AND CASE 
    WHEN ng.difficulty_level = 'easy' THEN get.difficulty_level = 'easy'
    WHEN ng.difficulty_level = 'medium' THEN get.difficulty_level IN ('easy', 'medium')
    ELSE get.difficulty_level IN ('medium', 'hard')
  END
  AND ROW_NUMBER() OVER (PARTITION BY ng.id ORDER BY get.importance_level DESC, get.created_at) <= 
    CASE 
      WHEN ng.difficulty_level = 'easy' THEN 6
      WHEN ng.difficulty_level = 'medium' THEN 8
      ELSE 10
    END;