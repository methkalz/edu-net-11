import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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
  Video,
  BookOpen,
  Folder,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  completed_videos: number;
  completed_projects: number;
  total_activities: number;
}

export interface RealAchievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  earnedAt?: Date;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  pointsReward: number;
}

export const useRealAchievements = () => {
  const { user, userProfile } = useAuth();
  const [achievements, setAchievements] = useState<RealAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const achievementDefinitions: Omit<RealAchievement, 'earned' | 'earnedAt' | 'progress'>[] = [
    {
      id: 'first_video',
      title: 'أول فيديو',
      description: 'شاهد أول فيديو تعليمي',
      icon: Video,
      maxProgress: 1,
      rarity: 'common',
      pointsReward: 10
    },
    {
      id: 'video_marathon',
      title: 'ماراثون الفيديوهات',
      description: 'شاهد 5 فيديوهات',
      icon: Video,
      maxProgress: 5,
      rarity: 'uncommon',
      pointsReward: 25
    },
    {
      id: 'video_expert',
      title: 'خبير الفيديوهات',
      description: 'شاهد 15 فيديو',
      icon: Crown,
      maxProgress: 15,
      rarity: 'rare',
      pointsReward: 50
    },
    {
      id: 'first_lesson',
      title: 'أول درس',
      description: 'أكمل أول درس',
      icon: BookOpen,
      maxProgress: 1,
      rarity: 'common',
      pointsReward: 15
    },
    {
      id: 'lesson_master',
      title: 'سيد الدروس',
      description: 'أكمل 10 دروس',
      icon: Medal,
      maxProgress: 10,
      rarity: 'rare',
      pointsReward: 75
    },
    {
      id: 'first_project',
      title: 'أول مشروع',
      description: 'أكمل أول مشروع',
      icon: Folder,
      maxProgress: 1,
      rarity: 'uncommon',
      pointsReward: 20
    },
    {
      id: 'project_champion',
      title: 'بطل المشاريع',
      description: 'أكمل 5 مشاريع',
      icon: Trophy,
      maxProgress: 5,
      rarity: 'epic',
      pointsReward: 100
    },
    {
      id: 'point_collector',
      title: 'جامع النقاط',
      description: 'اجمع 100 نقطة',
      icon: Star,
      maxProgress: 100,
      rarity: 'uncommon',
      pointsReward: 25
    },
    {
      id: 'point_master',
      title: 'سيد النقاط',
      description: 'اجمع 500 نقطة',
      icon: Gem,
      maxProgress: 500,
      rarity: 'epic',
      pointsReward: 75
    },
    {
      id: 'point_legend',
      title: 'أسطورة النقاط',
      description: 'اجمع 1000 نقطة',
      icon: Crown,
      maxProgress: 1000,
      rarity: 'legendary',
      pointsReward: 150
    },
    {
      id: 'daily_streak_3',
      title: 'مواظبة 3 أيام',
      description: 'ادخل للموقع لمدة 3 أيام متتالية',
      icon: Calendar,
      maxProgress: 3,
      rarity: 'common',
      pointsReward: 20
    },
    {
      id: 'daily_streak_7',
      title: 'أسبوع من المواظبة',
      description: 'ادخل للموقع لمدة 7 أيام متتالية',
      icon: Zap,
      maxProgress: 7,
      rarity: 'rare',
      pointsReward: 50
    },
    {
      id: 'daily_streak_30',
      title: 'شهر من التفاني',
      description: 'ادخل للموقع لمدة 30 يوم متتالي',
      icon: Target,
      maxProgress: 30,
      rarity: 'legendary',
      pointsReward: 200
    },
    {
      id: 'active_learner',
      title: 'متعلم نشط',
      description: 'أكمل 10 أنشطة مختلفة',
      icon: Award,
      maxProgress: 10,
      rarity: 'uncommon',
      pointsReward: 30
    }
  ];

  const fetchRealAchievements = async () => {
    if (!user || userProfile?.role !== 'student') return;

    try {
      setLoading(true);
      setError(null);

      // Get student statistics
      const { data: dashboardStatsRaw } = await supabase
        .rpc('get_student_dashboard_stats', { student_uuid: user.id });

      const dashboardStats = (dashboardStatsRaw as unknown) as DashboardStats | null;

      // Get user's total points
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('user_id', user.id)
        .single();

      // Get earned achievements
      const { data: earnedAchievements } = await supabase
        .from('student_achievements')
        .select('achievement_type, earned_at')
        .eq('student_id', user.id);

      // Calculate streak days
      const { data: recentActivity } = await supabase
        .from('student_activity_log')
        .select('created_at')
        .eq('student_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      let streakDays = 0;
      if (recentActivity && recentActivity.length > 0) {
        const today = new Date();
        const activityDates = recentActivity.map(a => new Date(a.created_at).toDateString());
        const uniqueDates = [...new Set(activityDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const activityDate = new Date(uniqueDates[i]);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (activityDate.toDateString() === expectedDate.toDateString()) {
            streakDays++;
          } else {
            break;
          }
        }
      }

      // Calculate progress for each achievement
      const processedAchievements = achievementDefinitions.map(definition => {
        const earnedData = earnedAchievements?.find(ea => ea.achievement_type === definition.id);
        let progress = 0;

        switch (definition.id) {
          case 'first_video':
          case 'video_marathon':
          case 'video_expert':
            progress = dashboardStats?.completed_videos || 0;
            break;
          case 'first_lesson':
          case 'lesson_master':
            progress = dashboardStats?.completed_projects || 0; // Using projects as lessons
            break;
          case 'first_project':
          case 'project_champion':
            progress = dashboardStats?.completed_projects || 0;
            break;
          case 'point_collector':
          case 'point_master':
          case 'point_legend':
            progress = profileData?.points || 0;
            break;
          case 'daily_streak_3':
          case 'daily_streak_7':
          case 'daily_streak_30':
            progress = streakDays;
            break;
          case 'active_learner':
            progress = dashboardStats?.total_activities || 0;
            break;
          default:
            progress = 0;
        }

        return {
          ...definition,
          earned: earnedData ? true : progress >= definition.maxProgress,
          earnedAt: earnedData ? new Date(earnedData.earned_at) : undefined,
          progress: Math.min(progress, definition.maxProgress)
        };
      });

      setAchievements(processedAchievements);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل الإنجازات';
      setError(errorMessage);
      logger.error('Error fetching real achievements', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const getEarnedAchievements = () => {
    return achievements.filter(a => a.earned);
  };

  const getInProgressAchievements = () => {
    return achievements.filter(a => !a.earned && a.progress > 0);
  };

  const getUpcomingAchievements = () => {
    return achievements.filter(a => !a.earned && a.progress === 0);
  };

  useEffect(() => {
    if (user && userProfile?.role === 'student') {
      fetchRealAchievements();
    }
  }, [user, userProfile]);

  return {
    achievements,
    earnedAchievements: getEarnedAchievements(),
    inProgressAchievements: getInProgressAchievements(),
    upcomingAchievements: getUpcomingAchievements(),
    loading,
    error,
    refetch: fetchRealAchievements
  };
};