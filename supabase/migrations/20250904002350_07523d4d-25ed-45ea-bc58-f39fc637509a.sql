-- أولاً: حذف النتائج المرتبطة بالزوج الذي نريد إزالته
DELETE FROM pair_matching_results 
WHERE pair_id = '1ece5968-9646-44b7-a291-fc057f63a753';

-- ثانياً: تحديث اللعبة الحالية لتقليل عدد الأزواج إلى 5
UPDATE pair_matching_games 
SET max_pairs = 5, 
    updated_at = now()
WHERE id = '9dabf609-1ebc-438b-9866-6851a68dc097';

-- ثالثاً: حذف آخر زوج من اللعبة الحالية للوصول إلى 5 أزواج
DELETE FROM pair_matching_pairs 
WHERE game_id = '9dabf609-1ebc-438b-9866-6851a68dc097' 
AND order_index = 6;