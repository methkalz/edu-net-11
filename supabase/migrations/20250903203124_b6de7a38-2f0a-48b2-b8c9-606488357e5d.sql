-- إصلاح RLS policies لجدول grade11_player_profiles للسماح بحذف البيانات من قبل النظام
-- إضافة policy للسماح للـ service role وال superadmin بحذف البيانات

-- حذف ال policy الحالية للحذف إذا كانت موجودة
DROP POLICY IF EXISTS "Users can delete their own profiles" ON grade11_player_profiles;

-- إضافة policy جديدة تسمح للمستخدمين بحذف ملفاتهم الشخصية
CREATE POLICY "Users can delete their own profiles" 
ON grade11_player_profiles 
FOR DELETE 
USING (user_id = auth.uid());

-- إضافة policy للسماح للـ service role بحذف أي بيانات (للتصفير)
CREATE POLICY "Service role can delete all profiles" 
ON grade11_player_profiles 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');

-- إضافة policy للسماح للـ superadmin بحذف أي بيانات
CREATE POLICY "Superadmins can delete all profiles" 
ON grade11_player_profiles 
FOR DELETE 
USING (get_user_role() = 'superadmin'::app_role);

-- التأكد من أن جدول grade11_lesson_rewards لديه نفس ال policies
-- حذف ال policy الحالية للحذف إذا كانت موجودة
DROP POLICY IF EXISTS "Service role can delete all lesson rewards" ON grade11_lesson_rewards;
DROP POLICY IF EXISTS "Superadmins can delete all lesson rewards" ON grade11_lesson_rewards;

-- إضافة policy للسماح للـ service role بحذف المكافآت
CREATE POLICY "Service role can delete all lesson rewards" 
ON grade11_lesson_rewards 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');

-- إضافة policy للسماح للـ superadmin بحذف المكافآت
CREATE POLICY "Superadmins can delete all lesson rewards" 
ON grade11_lesson_rewards 
FOR DELETE 
USING (get_user_role() = 'superadmin'::app_role);

-- إضافة نفس ال policies لباقي الجداول المتعلقة بالألعاب
-- grade11_game_progress
DROP POLICY IF EXISTS "Service role can delete all progress" ON grade11_game_progress;
DROP POLICY IF EXISTS "Superadmins can delete all progress" ON grade11_game_progress;

CREATE POLICY "Service role can delete all progress" 
ON grade11_game_progress 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Superadmins can delete all progress" 
ON grade11_game_progress 
FOR DELETE 
USING (get_user_role() = 'superadmin'::app_role);

-- grade11_game_achievements
DROP POLICY IF EXISTS "Service role can delete all achievements" ON grade11_game_achievements;
DROP POLICY IF EXISTS "Superadmins can delete all achievements" ON grade11_game_achievements;

CREATE POLICY "Service role can delete all achievements" 
ON grade11_game_achievements 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Superadmins can delete all achievements" 
ON grade11_game_achievements 
FOR DELETE 
USING (get_user_role() = 'superadmin'::app_role);