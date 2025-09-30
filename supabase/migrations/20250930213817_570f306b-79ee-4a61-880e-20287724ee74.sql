
-- تحديث القيمة الافتراضية لـ total_xp في جدول grade11_player_profiles لتكون 100
ALTER TABLE grade11_player_profiles 
ALTER COLUMN total_xp SET DEFAULT 100;

-- تحديث القيمة الافتراضية لـ level لتكون 1 (متوافق مع 100 نقطة = مستوى 2)
-- Level calculation: FLOOR(total_xp / 100) + 1
-- مع 100 نقطة أساسية: FLOOR(100 / 100) + 1 = 2
ALTER TABLE grade11_player_profiles 
ALTER COLUMN level SET DEFAULT 2;
