import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export interface PlayerProfile {
  id: string;
  user_id: string;
  player_name: string;
  level_number: number;
  coins: number;
  current_streak: number;
  avatar_url: string;
  experience_points: number;
  last_played_at: string;
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

export const useGrade10PlayerProfile = () => {
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
    if (!user || !playerProfile) return 0;

    try {
      const { data } = await supabase
        .from('grade10_game_progress')
        .select('lesson_id')
        .eq('player_id', playerProfile.id)
        .eq('is_completed', true);

      return data?.length || 0;
    } catch (err: any) {
      logger.error('Error fetching completed lessons', err);
      return 0;
    }
  }, [user, playerProfile]);

  // جلب الإنجازات المحققة
  const fetchAchievements = useCallback(async () => {
    if (!user || !playerProfile) return [];

    try {
      const { data } = await supabase
        .from('grade10_game_achievements')
        .select('achievement_type')
        .eq('player_id', playerProfile.id)
        .eq('is_unlocked', true);

      return data?.map(item => item.achievement_type) || [];
    } catch (err: any) {
      logger.error('Error fetching achievements', err);
      return [];
    }
  }, [user, playerProfile]);

  // تحويل بيانات الملف الشخصي إلى تنسيق PlayerStats للتوافق مع الكود الموجود
  const getPlayerStats = useCallback((): PlayerStats | null => {
    if (!playerProfile || !userProfile) return null;

    return {
      id: playerProfile.id,
      name: playerProfile.player_name,
      level: playerProfile.level_number,
      xp: playerProfile.experience_points % 100, // XP الحالي للمستوى
      totalXP: playerProfile.experience_points,
      coins: playerProfile.coins,
      streakDays: playerProfile.current_streak,
      completedLessons: completedLessonsCount,
      avatarId: 'student1', // Default avatar
      achievements: unlockedAchievements,
      lastPlayed: new Date(playerProfile.last_played_at || playerProfile.updated_at)
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

      // البحث عن الملف الشخصي الموجود
      let { data: existingProfile, error: fetchError } = await supabase
        .from('grade10_player_profiles')
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
          player_name: userProfile.full_name || userProfile.email || 'لاعب جديد',
          level_number: 1,
          coins: 100,
          current_streak: 0,
          avatar_url: '/avatars/student1.png',
          experience_points: 0,
          last_played_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('grade10_player_profiles')
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
      const lastPlayed = new Date(playerProfile.last_played_at || playerProfile.updated_at).toDateString();
      
      if (today !== lastPlayed) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        let newStreakDays = playerProfile.current_streak;
        
        if (lastPlayed === yesterday.toDateString()) {
          // استمرار التتابع
          newStreakDays = playerProfile.current_streak + 1;
        } else if (lastPlayed !== today) {
          // انقطاع التتابع، البدء من جديد
          newStreakDays = 1;
        }

        const { error } = await supabase
          .from('grade10_player_profiles')
          .update({
            current_streak: newStreakDays,
            last_played_at: new Date().toISOString()
          })
          .eq('id', playerProfile.id);

        if (error) throw error;

        setPlayerProfile(prev => prev ? {
          ...prev,
          current_streak: newStreakDays,
          last_played_at: new Date().toISOString()
        } : null);

        // إشعار بالتتابع الجديد
        if (newStreakDays > playerProfile.current_streak) {
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
        .from('grade10_player_profiles')
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
      const newTotalXP = playerProfile.experience_points + xp;
      const newLevel = Math.floor(newTotalXP / 100) + 1; // كل 100 نقطة خبرة = مستوى جديد

      const updateData: any = { experience_points: newTotalXP };
      
      // تحديث المستوى إذا تغير
      if (newLevel > playerProfile.level_number) {
        updateData.level_number = newLevel;
        
        // مكافأة على المستوى الجديد
        updateData.coins = playerProfile.coins + (newLevel * 50);
        
        toast({
          title: `🎉 مستوى جديد!`,
          description: `تهانينا! وصلت للمستوى ${newLevel} وحصلت على ${newLevel * 50} عملة!`,
          duration: 6000
        });
      }

      const { error } = await supabase
        .from('grade10_player_profiles')
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
        newLevel: updateData.level_number || playerProfile.level_number 
      });
      
      return true;
    } catch (err: any) {
      logger.error('Error adding experience', err);
      return false;
    }
  }, [user, playerProfile, toast]);

  // تحديث اختيار الصورة الرمزية
  const updateAvatar = useCallback(async (avatarUrl: string) => {
    if (!user || !playerProfile) return false;

    try {
      const { error } = await supabase
        .from('grade10_player_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', playerProfile.id);

      if (error) throw error;

      setPlayerProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      
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

  // تحديث البيانات الإضافية عند تغيير الملف الشخصي
  useEffect(() => {
    if (playerProfile) {
      Promise.all([
        fetchCompletedLessons(),
        fetchAchievements()
      ]).then(([lessonsCount, achievementsList]) => {
        setCompletedLessonsCount(lessonsCount);
        setUnlockedAchievements(achievementsList);
      });
    }
  }, [playerProfile, fetchCompletedLessons, fetchAchievements]);

  // مراقبة تغييرات المصادقة
  useEffect(() => {
    fetchOrCreatePlayerProfile();
  }, [fetchOrCreatePlayerProfile]);

  // دعم المزامنة في الوقت الفعلي
  useEffect(() => {
    if (!user || !playerProfile) return;

    const channel = supabase
      .channel('grade10-player-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grade10_player_profiles',
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