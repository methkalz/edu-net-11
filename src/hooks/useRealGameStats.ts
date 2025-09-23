import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export interface RealGameStats {
  totalPoints: number;
  completedGames: number;
  currentRank: number;
  completedVideos: number;
  completedLessons: number;
  completedProjects: number;
  streakDays: number;
  totalActivities: number;
  achievementsCount: number;
}

export const useRealGameStats = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<RealGameStats>({
    totalPoints: 0,
    completedGames: 0,
    currentRank: 0,
    completedVideos: 0,
    completedLessons: 0,
    completedProjects: 0,
    streakDays: 0,
    totalActivities: 0,
    achievementsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealStats = async () => {
    if (!user || userProfile?.role !== 'student') return;

    try {
      setLoading(true);
      setError(null);

      // Get student dashboard stats
      const { data: dashboardStats, error: dashboardError } = await supabase
        .rpc('get_student_dashboard_stats', { student_uuid: user.id });

      if (dashboardError) throw dashboardError;

      // Type assertion for dashboard stats
      const stats = dashboardStats as {
        completed_videos: number;
        completed_projects: number;
        total_activities: number;
      } | null;

      // Get user's total points from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get student's rank by comparing points with other students
      const { data: rankData, error: rankError } = await supabase
        .from('profiles')
        .select('points')
        .eq('role', 'student')
        .eq('school_id', userProfile?.school_id)
        .order('points', { ascending: false });

      if (rankError) throw rankError;

      const currentUserPoints = profileData?.points || 0;
      const currentRank = (rankData?.findIndex(p => p.points <= currentUserPoints) || 0) + 1;

      // Count completed games from student_unified_points
      const { data: gameCompletions, error: gameError } = await supabase
        .from('student_unified_points')
        .select('source_id')
        .eq('student_id', user.id)
        .eq('source_type', 'game_completion');

      if (gameError) throw gameError;

      // Count achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('student_achievements')
        .select('id')
        .eq('student_id', user.id);

      if (achievementsError) throw achievementsError;

      // Calculate streak days from activity log
      const { data: recentActivity, error: activityError } = await supabase
        .from('student_activity_log')
        .select('created_at')
        .eq('student_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (activityError) throw activityError;

      // Calculate consecutive days
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

      setStats({
        totalPoints: currentUserPoints,
        completedGames: gameCompletions?.length || 0,
        currentRank,
        completedVideos: stats?.completed_videos || 0,
        completedLessons: stats?.completed_projects || 0, // Using projects as lessons for now
        completedProjects: stats?.completed_projects || 0,
        streakDays,
        totalActivities: stats?.total_activities || 0,
        achievementsCount: achievements?.length || 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل الإحصائيات';
      setError(errorMessage);
      logger.error('Error fetching real game stats', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userProfile?.role === 'student') {
      fetchRealStats();
    }
  }, [user, userProfile]);

  return {
    stats,
    loading,
    error,
    refetch: fetchRealStats
  };
};