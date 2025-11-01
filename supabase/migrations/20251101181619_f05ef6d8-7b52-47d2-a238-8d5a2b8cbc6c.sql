
-- إنشاء البطاقتين كدروس لعبة في موضوع أساسيات الاتصال
INSERT INTO grade11_lessons (id, topic_id, title, content, order_index, is_active)
VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '57b88a37-5337-4668-bc5d-7c25462e1456',
  'بطاقة 1: أساسيات الاتصال',
  '<p>🎯 بطاقة لعبة تحتوي على 10 أسئلة حول شبكات الحاسوب وأنواعها ومعمارياتها</p>',
  100,
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  '57b88a37-5337-4668-bc5d-7c25462e1456',
  'بطاقة 2: أجهزة وطوبولوجيا الشبكات',
  '<p>🎯 بطاقة لعبة تحتوي على 10 أسئلة حول أجهزة الشبكات والطوبولوجيا والكابلات</p>',
  101,
  true
);

-- ربط أول 10 أسئلة بالبطاقة الأولى
WITH first_10 AS (
  SELECT id FROM grade11_game_questions
  WHERE topic_id = '57b88a37-5337-4668-bc5d-7c25462e1456' 
    AND lesson_id IS NULL
  ORDER BY created_at
  LIMIT 10
)
UPDATE grade11_game_questions
SET lesson_id = '11111111-1111-1111-1111-111111111111'
WHERE id IN (SELECT id FROM first_10);

-- ربط ثاني 10 أسئلة بالبطاقة الثانية
WITH second_10 AS (
  SELECT id FROM grade11_game_questions
  WHERE topic_id = '57b88a37-5337-4668-bc5d-7c25462e1456' 
    AND lesson_id IS NULL
  ORDER BY created_at
  LIMIT 10
)
UPDATE grade11_game_questions
SET lesson_id = '22222222-2222-2222-2222-222222222222'
WHERE id IN (SELECT id FROM second_10);
