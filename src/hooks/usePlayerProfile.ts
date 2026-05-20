import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export interface PlayerProfile {
  id: string;
  user_id: string;
  game_id: string;
  player_name: string;
  level: number;
  coins: number;
  streak_days: number;
  avatar_id: string;
  total_xp: number;
  last_played: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  name: string;
  level: number;
  xp: number;
  totalXP: number;
  coins: number;
  streakDays: number;
  completedLessons: number;
  avatarId: string;
  achievements: string[];
  lastPlayed: Date;
}

const NETWORKS_GAME_ID = '550e8400-e29b-41d4-a716-446655440000'; // معرف ثابت للعبة الشبكات

export const usePlayerProfile = () => {
  const { user, userProfile } = useAuth();
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // حالة إضافية لتتبع إحصائيات اللاعب
  const [completedLessonsCount, setCompletedLessonsCount] = useState<number>(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // جلب عدد الدروس المكتملة
  const fetchCompletedLessons = useCallback(async () => {
    if (!user) return 0;

    try {
      const { data } = await supabase
        .from('grade11_game_progress')
        .select('lesson_id')
        .eq('user_id', user.id);

      return data?.length || 0;
    } catch (err: any) {
      logger.error('Error fetching completed lessons', err);
      return 0;
    }
  }, [user]);

  // جلب الإنجازات المحققة
  const fetchAchievements = useCallback(async () => {
    if (!user) return [];

    try {
      const { data } = await supabase
        .from('grade11_game_achievements')
        .select('achievement_type')
        .eq('user_id', user.id);

      return data?.map(item => item.achievement_type) || [];
    } catch (err: any) {
      logger.error('Error fetching achievements', err);
      return [];
    }
  }, [user]);

  // تحويل بيانات الملف الشخصي إلى تنسيق PlayerStats للتوافق مع الكود الموجود
  const getPlayerStats = useCallback((): PlayerStats | null => {
    if (!playerProfile || !userProfile) return null;

    return {
      id: playerProfile.id,
      name: playerProfile.player_name,
      level: playerProfile.level,
      xp: playerProfile.total_xp % 100, // XP الحالي للمستوى
      totalXP: playerProfile.total_xp,
      coins: playerProfile.coins,
      streakDays: playerProfile.streak_days,
      completedLessons: completedLessonsCount,
      avatarId: playerProfile.avatar_id,
      achievements: unlockedAchievements,
      lastPlayed: new Date(playerProfile.last_played)
    };
  }, [playerProfile, userProfile, completedLessonsCount, unlockedAchievements]);

  // جلب أو إنشاء ملف شخصي للاعب
  const fetchOrCreatePlayerProfile = useCallback(async () => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
      if (authenticatedUser?.id && authenticatedUser.id !== user.id) {
        setPlayerProfile({
          id: `impersonated-${user.id}`,
          user_id: user.id,
          game_id: NETWORKS_GAME_ID,
          player_name: userProfile.full_name || userProfile.email || 'لاعب جديد',
          level: 1,
          coins: 100,
          streak_days: 0,
          avatar_id: 'student1',
          total_xp: 0,
          last_played: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setCompletedLessonsCount(0);
        setUnlockedAchievements([]);
        return;
      }

      // البحث عن الملف الشخصي الموجود
      let { data: existingProfile, error: fetchError } = await supabase
        .from('grade11_player_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        setPlayerProfile(existingProfile);
        logger.info('Existing player profile loaded', { userId: user.id });
      } else {
        // إنشاء ملف شخصي جديد
        const newProfile = {
          user_id: user.id,
          game_id: null,
          player_name: userProfile.full_name || userProfile.email || 'لاعب جديد',
          level: 1,
          coins: 100,
          streak_days: 0,
          avatar_id: 'student1',
          total_xp: 0,
          last_played: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('grade11_player_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;

        setPlayerProfile(createdProfile);
        logger.info('New player profile created', { userId: user.id });

        toast({
          title: '🎮 مرحباً في اللعبة!',
          description: `أهلاً وسهلاً ${newProfile.player_name}! لقد تم إنشاء ملفك الشخصي.`,
          duration: 5000
        });
      }

      // تحديث التتابع اليومي
      await updateDailyStreak();

      // جلب البيانات الإضافية
      const [lessonsCount, achievementsList] = await Promise.all([
        fetchCompletedLessons(),
        fetchAchievements()
      ]);

      setCompletedLessonsCount(lessonsCount);
      setUnlockedAchievements(achievementsList);

    } catch (err: any) {
      logger.error('Error fetching/creating player profile', err);
      setError(err.message);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'تعذر تحميل بيانات اللاعب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, toast]);

  // تحديث التتابع اليومي
  const updateDailyStreak = useCallback(async () => {
    if (!user || !playerProfile) return;

    try {
      const today = new Date().toDateString();
      const lastPlayed = new Date(playerProfile.last_played).toDateString();
      
      if (today !== lastPlayed) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        let newStreakDays = playerProfile.streak_days;
        
        if (lastPlayed === yesterday.toDateString()) {
          // استمرار التتابع
          newStreakDays = playerProfile.streak_days + 1;
        } else if (lastPlayed !== today) {
          // انقطاع التتابع، البدء من جديد
          newStreakDays = 1;
        }

        const { error } = await supabase
          .from('grade11_player_profiles')
          .update({
            streak_days: newStreakDays,
            last_played: new Date().toISOString()
          })
          .eq('id', playerProfile.id);

        if (error) throw error;

        setPlayerProfile(prev => prev ? {
          ...prev,
          streak_days: newStreakDays,
          last_played: new Date().toISOString()
        } : null);

        // إشعار بالتتابع الجديد
        if (newStreakDays > playerProfile.streak_days) {
          toast({
            title: `🔥 ${newStreakDays} أيام متتالية!`,
            description: 'استمر في التعلم للحفاظ على تتابعك!',
            duration: 4000
          });
        }
      }
    } catch (err: any) {
      logger.error('Error updating daily streak', err);
    }
  }, [user, playerProfile, toast]);

  // إضافة عملات
  const addCoins = useCallback(async (amount: number) => {
    if (!user || !playerProfile || amount <= 0) return false;

    try {
      const newCoins = playerProfile.coins + amount;

      const { error } = await supabase
        .from('grade11_player_profiles')
        .update({ coins: newCoins })
        .eq('id', playerProfile.id);

      if (error) throw error;

      setPlayerProfile(prev => prev ? { ...prev, coins: newCoins } : null);
      
      logger.info('Coins added', { userId: user.id, amount, newTotal: newCoins });
      return true;
    } catch (err: any) {
      logger.error('Error adding coins', err);
      return false;
    }
  }, [user, playerProfile]);

  // إضافة خبرة وتحديث المستوى
  const addExperience = useCallback(async (xp: number) => {
    if (!user || !playerProfile || xp <= 0) return false;

    try {
      const newTotalXP = playerProfile.total_xp + xp;
      const newLevel = Math.floor(newTotalXP / 100) + 1; // كل 100 نقطة خبرة = مستوى جديد

      const updateData: any = { total_xp: newTotalXP };
      
      // تحديث المستوى إذا تغير
      if (newLevel > playerProfile.level) {
        updateData.level = newLevel;
        
        // مكافأة على المستوى الجديد
        updateData.coins = playerProfile.coins + (newLevel * 50);
        
        toast({
          title: `🎉 مستوى جديد!`,
          description: `تهانينا! وصلت للمستوى ${newLevel} وحصلت على ${newLevel * 50} عملة!`,
          duration: 6000
        });
      }

      const { error } = await supabase
        .from('grade11_player_profiles')
        .update(updateData)
        .eq('id', playerProfile.id);

      if (error) throw error;

      setPlayerProfile(prev => prev ? { 
        ...prev, 
        ...updateData
      } : null);

      logger.info('Experience added', { 
        userId: user.id, 
        xp, 
        newTotalXP, 
        newLevel: updateData.level || playerProfile.level 
      });
      
      return true;
    } catch (err: any) {
      logger.error('Error adding experience', err);
      return false;
    }
  }, [user, playerProfile, toast]);

  // تحديث اختيار الصورة الرمزية
  const updateAvatar = useCallback(async (avatarId: string) => {
    if (!user || !playerProfile) return false;

    try {
      const { error } = await supabase
        .from('grade11_player_profiles')
        .update({ avatar_id: avatarId })
        .eq('id', playerProfile.id);

      if (error) throw error;

      setPlayerProfile(prev => prev ? { ...prev, avatar_id: avatarId } : null);
      
      toast({
        title: '✨ تم تحديث الصورة الرمزية!',
        description: 'تم تغيير صورتك الرمزية بنجاح',
        duration: 3000
      });

      return true;
    } catch (err: any) {
      logger.error('Error updating avatar', err);
      return false;
    }
  }, [user, playerProfile, toast]);

  // مراقبة تغييرات المصادقة
  useEffect(() => {
    fetchOrCreatePlayerProfile();
  }, [fetchOrCreatePlayerProfile]);

  // دعم المزامنة في الوقت الفعلي
  useEffect(() => {
    if (!user || !playerProfile) return;

    const channel = supabase
      .channel('player-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grade11_player_profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setPlayerProfile(payload.new as PlayerProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playerProfile]);

  return {
    playerProfile,
    playerStats: getPlayerStats(),
    loading,
    error,
    addCoins,
    addExperience,
    updateAvatar,
    updateDailyStreak,
    refetch: fetchOrCreatePlayerProfile
  };
};