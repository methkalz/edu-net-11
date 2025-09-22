import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { gameDataErrorHandler } from '@/lib/error-handling/game-data/game-data-error-handler';
import { toast } from '@/hooks/use-toast';

interface GameDataStats {
  totalUsers: number;
  totalProgress: number;
  totalGames: number;
  totalSessions: number;
  totalResults: number;
  activeUsers?: number;
  completionRate?: number;
  averageScore?: number;
  gamesAvailable?: number;
  playersThisWeek?: number;
}

interface Game {
  id: string;
  name: string;
  grade_level: string;
  subject: string;
  is_active: boolean;
}

export const useGameDataManagement = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // مسح الأخطاء عند بداية عملية جديدة
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // جلب إحصائيات شاملة أو مخصصة للعبة واحدة
  const getGameDataStats = useCallback(async (gameId?: string): Promise<GameDataStats | null> => {
    return await gameDataErrorHandler.withGameDataRetry(
      async () => {
        setLoading(true);
        clearError();

        // التحقق من صلاحيات السوبر آدمن
        if (userProfile?.role !== 'superadmin') {
          throw new Error('Unauthorized access to game data stats');
        }

        // جلب عدد الألعاب المتاحة
        const { count: gamesCount } = await supabase
          .from('pair_matching_games')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // جلب عدد سجلات التقدم للاعبين
        const { count: progressCount } = await supabase
          .from('player_game_progress')
          .select('*', { count: 'exact', head: true });

        // جلب عدد جلسات الألعاب
        const { count: sessionsCount } = await supabase
          .from('pair_matching_sessions')
          .select('*', { count: 'exact', head: true });

        // جلب عدد نتائج الألعاب
        const { count: resultsCount } = await supabase
          .from('pair_matching_results')
          .select('*', { count: 'exact', head: true });

        // الحصول على عدد المستخدمين الفريدين من تقدم اللاعبين
        const { data: uniqueUsersData } = await supabase
          .from('player_game_progress')
          .select('player_id');

        // استخراج المستخدمين الفريدين
        const uniqueUserIds = [...new Set(uniqueUsersData?.map(item => item.player_id) || [])];

        // حساب إحصائيات إضافية - النشاط الأخير (آخر أسبوع)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentActivity } = await supabase
          .from('pair_matching_sessions')
          .select('player_id, score, pairs_matched, completed_at')
          .gte('created_at', oneWeekAgo)
          .not('completed_at', 'is', null);

        const playersThisWeek = [...new Set(recentActivity?.map(item => item.player_id) || [])].length;
        
        const completedSessions = recentActivity?.filter(item => item.completed_at && item.score > 0) || [];
        const completionRate = recentActivity && recentActivity.length > 0 
          ? Math.round((completedSessions.length / recentActivity.length) * 100) 
          : 0;

        const averageScore = completedSessions.length > 0
          ? Math.round(completedSessions.reduce((sum, item) => {
              const scorePercent = item.pairs_matched > 0 ? (item.score / item.pairs_matched) * 10 : 0; // 10 نقاط لكل زوج
              return sum + scorePercent;
            }, 0) / completedSessions.length)
          : 0;

        // حساب المستخدمين النشطين (لعبوا في آخر 24 ساعة)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: todayActivity } = await supabase
          .from('pair_matching_sessions')
          .select('player_id')
          .gte('created_at', oneDayAgo);

        const activeUsers = [...new Set(todayActivity?.map(item => item.player_id) || [])].length;

        const stats: GameDataStats = {
          totalUsers: uniqueUserIds.length || 0,
          totalProgress: progressCount || 0,
          totalGames: gamesCount || 0,
          totalSessions: sessionsCount || 0,
          totalResults: resultsCount || 0,
          activeUsers,
          completionRate,
          averageScore,
          gamesAvailable: gamesCount || 0,
          playersThisWeek
        };

        logger.info('Pair Matching game data stats fetched successfully', { 
          gameId: gameId || 'all', 
          ...stats 
        });
        return stats;
      },
      'fetch_stats',
      { maxRetries: 3, retryDelay: 1000, exponentialBackoff: true }
    ).finally(() => {
      setLoading(false);
    });
  }, [userProfile?.role, clearError]);

  const resetUserGameData = useCallback(async (gameId: string | null, userId: string): Promise<boolean> => {
    const result = await gameDataErrorHandler.withGameDataRetry(
      async () => {
        setLoading(true);
        clearError();

        // التحقق من صلاحيات السوبر آدمن
        if (userProfile?.role !== 'superadmin') {
          throw new Error('Unauthorized access to reset user game data');
        }

        const { data, error } = await supabase.functions.invoke('reset-game-data', {
          body: {
            action: 'reset_user',
            userId: userId,
            gameId: gameId,
            adminId: userProfile.user_id
          }
        });

        if (error) {
          throw new Error(`Edge function error: ${JSON.stringify(error)}`);
        }

        logger.info('User game data reset successfully', { gameId, userId, data });
        toast({
          title: 'تم بنجاح',
          description: `تم تصفير بيانات المستخدم${gameId ? ' في اللعبة المحددة' : ''} بنجاح`
        });
        return true;
      },
      'reset_user',
      { maxRetries: 2, retryDelay: 1500 }
    ).finally(() => {
      setLoading(false);
    });

    return result ?? false;
  }, [userProfile?.role, clearError]);

  const resetLessonData = useCallback(async (gameId: string | null, lessonId: string): Promise<boolean> => {
    const result = await gameDataErrorHandler.withGameDataRetry(
      async () => {
        setLoading(true);
        clearError();

        // التحقق من صلاحيات السوبر آدمن
        if (userProfile?.role !== 'superadmin') {
          throw new Error('Unauthorized access to reset lesson data');
        }

        const { data, error } = await supabase.functions.invoke('reset-game-data', {
          body: {
            action: 'reset_lesson',
            lessonId: lessonId,
            gameId: gameId,
            adminId: userProfile.user_id
          }
        });

        if (error) {
          throw new Error(`Edge function error: ${JSON.stringify(error)}`);
        }

        logger.info('Lesson data reset successfully', { gameId, lessonId, data });
        toast({
          title: 'تم بنجاح',
          description: `تم تصفير بيانات الدرس${gameId ? ' في اللعبة المحددة' : ''} بنجاح`
        });
        return true;
      },
      'reset_lesson',
      { maxRetries: 2, retryDelay: 1500 }
    ).finally(() => {
      setLoading(false);
    });

    return result ?? false;
  }, [userProfile?.role, clearError]);

  const resetAllGameData = useCallback(async (gameId: string | null): Promise<boolean> => {
    const result = await gameDataErrorHandler.withGameDataRetry(
      async () => {
        setLoading(true);
        clearError();

        // التحقق من صلاحيات السوبر آدمن
        if (userProfile?.role !== 'superadmin') {
          throw new Error('Unauthorized access to reset all game data');
        }

        const { data, error } = await supabase.functions.invoke('reset-game-data', {
          body: {
            action: gameId ? 'reset_game' : 'reset_all',
            gameId: gameId,
            adminId: userProfile.user_id
          }
        });

        if (error) {
          throw new Error(`Edge function error: ${JSON.stringify(error)}`);
        }

        logger.info('Game data reset successfully', { gameId, data });
        toast({
          title: 'تم بنجاح',
          description: gameId 
            ? 'تم تصفير جميع بيانات اللعبة المحددة بنجاح'
            : 'تم تصفير جميع بيانات الألعاب بنجاح'
        });
        return true;
      },
      gameId ? 'reset_game' : 'reset_all',
      { maxRetries: 1, retryDelay: 2000 }
    ).finally(() => {
      setLoading(false);
    });

    return result ?? false;
  }, [userProfile?.role, clearError]);

  return {
    getGameDataStats,
    resetUserGameData,
    resetLessonData,
    resetAllGameData,
    loading,
    error,
    clearError
  };
};