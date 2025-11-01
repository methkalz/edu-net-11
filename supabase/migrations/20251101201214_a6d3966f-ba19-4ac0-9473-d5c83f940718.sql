-- تحديث بنية بيانات الأسئلة الجديدة (البطاقات 514-521)
-- تحويل choices من object {a: "text", b: "text"} إلى array [{id: "A", text: "text"}, {id: "B", text: "text"}]

UPDATE grade11_game_questions
SET 
  choices = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', UPPER(key),
        'text', value
      ) ORDER BY key
    )
    FROM jsonb_each_text(choices)
  ),
  correct_answer = UPPER(correct_answer)
WHERE lesson_id IN (
  SELECT id 
  FROM grade11_lessons 
  WHERE order_index BETWEEN 514 AND 521
)
AND choices IS NOT NULL
AND jsonb_typeof(choices) = 'object';