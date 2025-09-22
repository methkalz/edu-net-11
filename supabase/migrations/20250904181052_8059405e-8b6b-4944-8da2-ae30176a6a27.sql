-- حذف جميع بيانات التقدم الخاطئة وإعادة التعيين الصحيح

-- 1. حذف جميع بيانات التقدم الموجودة
DELETE FROM player_game_progress;

-- 2. حذف جميع الجلسات
DELETE FROM pair_matching_sessions;

-- 3. حذف جميع النتائج
DELETE FROM pair_matching_results;

-- 4. تنظيف الألعاب وترتيبها بالشكل الصحيح
-- إزالة الألعاب المكررة والاحتفاظ بواحدة فقط لكل موضوع ومستوى صعوبة

-- تحديث الألعاب لضمان التنظيم الصحيح
UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 1 
WHERE id = 'ede1351d-709b-4669-b5dd-27b246c759cc'; -- أمن المعلومات

UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 2 
WHERE id = 'e4690183-2fe0-4f6b-95c8-66bfb9696740'; -- قواعد البيانات

UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 3 
WHERE id = '4c10adc2-2064-45cc-b73b-7d7978bc6611'; -- أنظمة التشغيل

UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 4 
WHERE id = '7156bd1d-781c-41d5-9afb-d94c6d2f2bfb'; -- البرمجة الكائنية

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 1 
WHERE id = 'ea07614d-722f-4624-b7f1-f1eac546033c'; -- أساسيات الحاسوب

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 2 
WHERE id = '6ade5280-64fd-4ad6-b078-631b4b5408b9'; -- أجهزة الإدخال والإخراج

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 3 
WHERE id = '2e0ab6cf-b2bd-456d-b86b-863363029c4c'; -- أساسيات الشبكات

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 1 
WHERE id = '2f161c05-07ef-4616-b66c-e2bfcf662e28'; -- بروتوكولات الشبكة

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 2 
WHERE id = 'f5595589-38a2-4d77-bd0d-58d185a065dc'; -- لغات البرمجة

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 3 
WHERE id = '9dabf609-1ebc-438b-9866-6851a68dc097'; -- المفاهيم التقنية

-- إزالة أو إلغاء تفعيل الألعاب المكررة أو غير المرغوبة
UPDATE pair_matching_games SET is_active = false 
WHERE id NOT IN (
  'ede1351d-709b-4669-b5dd-27b246c759cc',
  'e4690183-2fe0-4f6b-95c8-66bfb9696740',
  '4c10adc2-2064-45cc-b73b-7d7978bc6611',
  '7156bd1d-781c-41d5-9afb-d94c6d2f2bfb',
  'ea07614d-722f-4624-b7f1-f1eac546033c',
  '6ade5280-64fd-4ad6-b078-631b4b5408b9',
  '2e0ab6cf-b2bd-456d-b86b-863363029c4c',
  '2f161c05-07ef-4616-b66c-e2bfcf662e28',
  'f5595589-38a2-4d77-bd0d-58d185a065dc',
  '9dabf609-1ebc-438b-9866-6851a68dc097'
);