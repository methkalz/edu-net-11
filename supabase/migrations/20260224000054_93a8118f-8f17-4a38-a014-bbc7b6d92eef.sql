
-- Proportional normalization of 2025 exam points
DO $$
DECLARE
  target NUMERIC;
  current_sum NUMERIC;
  factor NUMERIC;
  new_sum NUMERIC;
  diff NUMERIC;
  diff_steps INT;
BEGIN
  -- ═══ Section 1 (b4acf7c2): target 60, current 65 ═══
  target := 60;
  SELECT SUM(q.points) INTO current_sum
  FROM bagrut_questions q
  WHERE q.section_id = 'b4acf7c2-cae2-43a6-97f1-8d47b6218e27'
  AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id);

  factor := target / current_sum;

  -- Round each leaf to nearest 0.5, minimum 0.5
  UPDATE bagrut_questions SET points = GREATEST(0.5, ROUND(points * factor * 2) / 2)
  WHERE section_id = 'b4acf7c2-cae2-43a6-97f1-8d47b6218e27'
  AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = bagrut_questions.id);

  -- Check sum and distribute remainder
  SELECT SUM(q.points) INTO new_sum
  FROM bagrut_questions q
  WHERE q.section_id = 'b4acf7c2-cae2-43a6-97f1-8d47b6218e27'
  AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id);

  diff := target - new_sum;
  IF diff > 0 THEN
    diff_steps := (diff / 0.5)::int;
    UPDATE bagrut_questions SET points = points + 0.5
    WHERE id IN (
      SELECT q.id FROM bagrut_questions q
      WHERE q.section_id = 'b4acf7c2-cae2-43a6-97f1-8d47b6218e27'
      AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id)
      ORDER BY q.points DESC, q.order_index ASC
      LIMIT diff_steps
    );
  ELSIF diff < 0 THEN
    diff_steps := (ABS(diff) / 0.5)::int;
    UPDATE bagrut_questions SET points = GREATEST(0.5, points - 0.5)
    WHERE id IN (
      SELECT q.id FROM bagrut_questions q
      WHERE q.section_id = 'b4acf7c2-cae2-43a6-97f1-8d47b6218e27'
      AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id)
      ORDER BY q.points DESC, q.order_index ASC
      LIMIT diff_steps
    );
  END IF;

  -- ═══ Section 2 (525d6531): target 40, current 41 ═══
  target := 40;
  SELECT SUM(q.points) INTO current_sum
  FROM bagrut_questions q
  WHERE q.section_id = '525d6531-bac6-4ee0-aff1-c6be8845ca22'
  AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id);

  factor := target / current_sum;

  UPDATE bagrut_questions SET points = GREATEST(0.5, ROUND(points * factor * 2) / 2)
  WHERE section_id = '525d6531-bac6-4ee0-aff1-c6be8845ca22'
  AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = bagrut_questions.id);

  SELECT SUM(q.points) INTO new_sum
  FROM bagrut_questions q
  WHERE q.section_id = '525d6531-bac6-4ee0-aff1-c6be8845ca22'
  AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id);

  diff := target - new_sum;
  IF diff > 0 THEN
    diff_steps := (diff / 0.5)::int;
    UPDATE bagrut_questions SET points = points + 0.5
    WHERE id IN (
      SELECT q.id FROM bagrut_questions q
      WHERE q.section_id = '525d6531-bac6-4ee0-aff1-c6be8845ca22'
      AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id)
      ORDER BY q.points DESC, q.order_index ASC
      LIMIT diff_steps
    );
  ELSIF diff < 0 THEN
    diff_steps := (ABS(diff) / 0.5)::int;
    UPDATE bagrut_questions SET points = GREATEST(0.5, points - 0.5)
    WHERE id IN (
      SELECT q.id FROM bagrut_questions q
      WHERE q.section_id = '525d6531-bac6-4ee0-aff1-c6be8845ca22'
      AND NOT EXISTS (SELECT 1 FROM bagrut_questions c WHERE c.parent_question_id = q.id)
      ORDER BY q.points DESC, q.order_index ASC
      LIMIT diff_steps
    );
  END IF;
END $$;
