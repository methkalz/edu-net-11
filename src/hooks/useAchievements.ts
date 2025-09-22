import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Crown, 
  Medal, 
  Award, 
  Gem,
  Network,
  Shield,
  Router,
  Globe,
  Settings,
  Cpu
} from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  condition: (stats: any) => boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlocked?: boolean;
  unlockedAt?: Date;
}

export interface AchievementStats {
  completedLessons: number;
  perfectScores: number;
  totalSessions: number;
  averageScore: number;
  fastCompletions: number;
  streakDays: number;
  totalXP: number;
  level: number;
  hasCompletedFirstLesson: boolean;
  hasPerfectScore: boolean;
  hasSpeedCompletion: boolean;
  hasFlawlessRun: boolean;
}

// الإنجازات المخصصة لمحتوى الشبكات
const NETWORK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'الخطوات الأولى في الشبكات',
    description: 'أكمل أول درس في الشبكات بنجاح',
    icon: Star,
    condition: (stats) => stats.hasCompletedFirstLesson,
    rarity: 'common',
    xpReward: 50
  },
  {
    id: 'perfect_score',
    title: 'خبير الشبكات',
    description: 'احصل على درجة مثالية 100% في أي اختبار شبكات',
    icon: Trophy,
    condition: (stats) => stats.hasPerfectScore,
    rarity: 'rare',
    xpReward: 100
  },
  {
    id: 'speed_demon',
    title: 'سرعة البرق',
    description: 'أكمل اختبار شبكات في أقل من 30 ثانية',
    icon: Zap,
    condition: (stats) => stats.hasSpeedCompletion,
    rarity: 'uncommon',
    xpReward: 75
  },
  {
    id: 'flawless',
    title: 'الأداء المثالي',
    description: 'أكمل اختبار بدون أخطاء',
    icon: Gem,
    condition: (stats) => stats.hasFlawlessRun,
    rarity: 'rare',
    xpReward: 125
  },
  {
    id: 'network_fundamentals',
    title: 'أساسيات الشبكات',
    description: 'أكمل 3 دروس في أساسيات الشبكات',
    icon: Network,
    condition: (stats) => stats.completedLessons >= 3,
    rarity: 'uncommon',
    xpReward: 100
  },
  {
    id: 'protocol_master',
    title: 'خبير البروتوكولات',
    description: 'أكمل 5 اختبارات في بروتوكولات الشبكة',
    icon: Router,
    condition: (stats) => stats.completedLessons >= 5,
    rarity: 'rare',
    xpReward: 150
  },
  {
    id: 'network_security',
    title: 'حارس الشبكة',
    description: 'تعلم أساسيات أمن الشبكات',
    icon: Shield,
    condition: (stats) => stats.completedLessons >= 7,
    rarity: 'epic',
    xpReward: 200
  },
  {
    id: 'daily_warrior',
    title: 'محارب يومي',
    description: 'حافظ على سلسلة 3 أيام من التعلم',
    icon: Target,
    condition: (stats) => stats.streakDays >= 3,
    rarity: 'uncommon',
    xpReward: 75
  },
  {
    id: 'streak_master',
    title: 'سيد المواظبة',
    description: 'حافظ على سلسلة 7 أيام متتالية',
    icon: Medal,
    condition: (stats) => stats.streakDays >= 7,
    rarity: 'epic',
    xpReward: 250
  },
  {
    id: 'network_explorer',
    title: 'مستكشف الشبكات',
    description: 'أكمل 10 اختبارات شبكات',
    icon: Globe,
    condition: (stats) => stats.completedLessons >= 10,
    rarity: 'rare',
    xpReward: 200
  },
  {
    id: 'network_engineer',
    title: 'مهندس الشبكات',
    description: 'وصل للمستوى 5 في تعلم الشبكات',
    icon: Crown,
    condition: (stats) => stats.level >= 5,
    rarity: 'epic',
    xpReward: 300
  },
  {
    id: 'network_architect',
    title: 'مصمم الشبكات',
    description: 'وصل للمستوى 10 وأصبح خبير شبكات',
    icon: Cpu,
    condition: (stats) => stats.level >= 10,
    rarity: 'legendary',
    xpReward: 500
  }
];

export const useAchievements = () => {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب الإنجازات المحققة من قاعدة البيانات
  const fetchUnlockedAchievements = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('grade11_game_achievements')
        .select('achievement_type, unlocked_at')
        .eq('user_id', user.id);

      if (error) throw error;

      return data?.map(item => item.achievement_type) || [];
    } catch (err: any) {
      logger.error('Error fetching achievements', err);
      return [];
    }
  }, [user]);

  // حساب إحصائيات الإنجازات من البيانات الحقيقية
  const calculateAchievementStats = useCallback(async (): Promise<AchievementStats | null> => {
    if (!user) return null;

    try {
      // جلب تقدم اللاعب
      const { data: progressData } = await supabase
        .from('grade11_game_progress')
        .select('lesson_id')
        .eq('user_id', user.id);

      // جلب ملف اللاعب
      const { data: profileData } = await supabase
        .from('grade11_player_profiles')
        .select('level, total_xp, streak_days')
        .eq('user_id', user.id)
        .maybeSingle();

      // جلب الإنجازات المحققة
      const { data: achievementsData } = await supabase
        .from('grade11_game_achievements')
        .select('achievement_type')
        .eq('user_id', user.id);

      const completedLessons = progressData?.length || 0;
      const achievementTypes = achievementsData?.map(a => a.achievement_type) || [];

      return {
        completedLessons,
        perfectScores: achievementTypes.filter(t => t === 'perfect_score').length,
        totalSessions: 0, // سيتم حسابه لاحقاً
        averageScore: 0,
        fastCompletions: achievementTypes.filter(t => t === 'speed_demon').length,
        streakDays: profileData?.streak_days || 0,
        totalXP: profileData?.total_xp || 0,
        level: profileData?.level || 1,
        hasCompletedFirstLesson: achievementTypes.includes('first_lesson'),
        hasPerfectScore: achievementTypes.includes('perfect_score'),
        hasSpeedCompletion: achievementTypes.includes('speed_demon'),
        hasFlawlessRun: achievementTypes.includes('flawless')
      };

    } catch (err: any) {
      logger.error('Error calculating achievement stats', err);
      return null;
    }
  }, [user]);

  // تحديث حالة الإنجازات
  const updateAchievements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [unlockedList, stats] = await Promise.all([
        fetchUnlockedAchievements(),
        calculateAchievementStats()
      ]);

      setUnlockedAchievements(unlockedList);
      setAchievementStats(stats);

    } catch (err: any) {
      logger.error('Error updating achievements', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, fetchUnlockedAchievements, calculateAchievementStats]);

  // الحصول على الإنجازات مع حالتها
  const getAchievementsWithStatus = useCallback((): Achievement[] => {
    if (!achievementStats) return NETWORK_ACHIEVEMENTS;

    return NETWORK_ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: unlockedAchievements.includes(achievement.id) || achievement.condition(achievementStats)
    }));
  }, [achievementStats, unlockedAchievements]);

  // التأثيرات الجانبية
  useEffect(() => {
    updateAchievements();
  }, [updateAchievements]);

  // مراقبة التحديثات في الوقت الفعلي
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('achievements-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grade11_game_achievements',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          updateAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, updateAchievements]);

  return {
    achievements: getAchievementsWithStatus(),
    unlockedAchievements,
    achievementStats,
    loading,
    error,
    refetch: updateAchievements
  };
};