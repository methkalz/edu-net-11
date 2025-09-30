-- إضافة عمود النقاط المكتسبة لجدول تقدم الدروس
ALTER TABLE grade11_game_progress 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- إضافة عمود النقاط المكتسبة لجدول تقدم مراحل الألعاب
ALTER TABLE player_game_progress 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN grade11_game_progress.points_earned IS 'النقاط المكتسبة من إكمال هذا الدرس';
COMMENT ON COLUMN player_game_progress.points_earned IS 'النقاط المكتسبة من إكمال هذه المرحلة';