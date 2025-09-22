-- تحديث max_pairs ليطابق عدد الأزواج الفعلية في كل لعبة
UPDATE pair_matching_games 
SET max_pairs = 6, updated_at = now()
WHERE title = 'أساسيات الشبكات - المستوى الأول' AND is_active = true;

UPDATE pair_matching_games 
SET max_pairs = 8, updated_at = now()
WHERE title = 'البروتوكولات والطبقات - المستوى الثاني' AND is_active = true;

UPDATE pair_matching_games 
SET max_pairs = 10, updated_at = now()
WHERE title = 'التوجيه والإعدادات المتقدمة - المستوى الثالث' AND is_active = true;

UPDATE pair_matching_games 
SET max_pairs = 12, updated_at = now()
WHERE title = 'الشبكات المتقدمة والأمان - المستوى الرابع' AND is_active = true;