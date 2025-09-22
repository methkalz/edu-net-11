-- إصلاح المشكلة: حذف السجلات التابعة أولاً لتجنب انتهاك القيود المرجعية
-- حذف نتائج المطابقة للألعاب غير المناسبة
DELETE FROM pair_matching_results 
WHERE pair_id IN (
  SELECT pmp.id FROM pair_matching_pairs pmp
  JOIN pair_matching_games pmg ON pmp.game_id = pmg.id
  WHERE pmg.title != 'مطابقة أساسيات الشبكات والاتصال'
  AND pmg.is_active = true
);

-- حذف أزواج المطابقة للألعاب غير المناسبة
DELETE FROM pair_matching_pairs 
WHERE game_id IN (
  SELECT id FROM pair_matching_games 
  WHERE title != 'مطابقة أساسيات الشبكات والاتصال'
  AND is_active = true
);

-- حذف جلسات المطابقة للألعاب غير المناسبة
DELETE FROM pair_matching_sessions 
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

-- إلغاء تفعيل الألعاب غير المناسبة
UPDATE pair_matching_games 
SET is_active = false, 
    updated_at = now()
WHERE title != 'مطابقة أساسيات الشبكات والاتصال'
AND is_active = true;