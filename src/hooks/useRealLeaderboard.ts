import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  points: number;
  rank: number;
  isCurrentUser: boolean;
  completedActivities: number;
  streakDays: number;
  achievementsCount: number;
  avatar?: string;
}

export interface LeaderboardData {
  players: LeaderboardPlayer[];
  currentUserRank: number;
  totalPlayers: number;
  averagePoints: number;
  totalPoints: number;
}

export const useRealLeaderboard = () => {
  const { user, userProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    players: [],
    currentUserRank: 0,
    totalPlayers: 0,
    averagePoints: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    if (!user || !userProfile?.school_id) return;

    try {
      setLoading(true);
      setError(null);

      // First get all students from the same school
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          points,
          avatar_url
        `)
        .eq('role', 'student')
        .eq('school_id', userProfile.school_id)
        .order('points', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setLeaderboard({
          players: [],
          currentUserRank: 0,
          totalPlayers: 0,
          averagePoints: 0,
          totalPoints: 0
        });
        return;
      }

      // Filter to get only grade 11 students
      const grade11Students = [];
      for (const profile of profilesData) {
        // Use the existing function to get student grade
        const { data: gradeData } = await supabase
          .rpc('get_student_assigned_grade', { student_user_id: profile.user_id });
        
        if (gradeData === '11') {
          grade11Students.push(profile);
        }
      }

      if (grade11Students.length === 0) {
        setLeaderboard({
          players: [],
          currentUserRank: 0,
          totalPlayers: 0,
          averagePoints: 0,
          totalPoints: 0
        });
        return;
      }

      // Get additional stats for each grade 11 student
      const playersWithStats = await Promise.all(
        grade11Students.map(async (student, index) => {
          // Get completed activities count
          const { data: activitiesData } = await supabase
            .from('student_activity_log')
            .select('id')
            .eq('student_id', student.user_id);

          // Get achievements count
          const { data: achievementsData } = await supabase
            .from('student_achievements')
            .select('id')
            .eq('student_id', student.user_id);

          // Calculate streak days from recent activity
          const { data: recentActivity } = await supabase
            .from('student_activity_log')
            .select('created_at')
            .eq('student_id', student.user_id)
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

          return {
            id: student.user_id,
            name: student.full_name || 'طالب',
            points: student.points || 0,
            rank: index + 1,
            isCurrentUser: student.user_id === user.id,
            completedActivities: activitiesData?.length || 0,
            streakDays,
            achievementsCount: achievementsData?.length || 0,
            avatar: student.avatar_url
          };
        })
      );

      const totalPoints = playersWithStats.reduce((sum, player) => sum + player.points, 0);
      const averagePoints = totalPoints / playersWithStats.length;
      const currentUserRank = playersWithStats.find(p => p.isCurrentUser)?.rank || 0;

      setLeaderboard({
        players: playersWithStats,
        currentUserRank,
        totalPlayers: playersWithStats.length,
        averagePoints: Math.round(averagePoints),
        totalPoints
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل لوحة المتصدرين';
      setError(errorMessage);
      logger.error('Error fetching leaderboard', err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Get players sorted by different metrics
  const getPlayersByStreak = () => {
    return [...leaderboard.players].sort((a, b) => b.streakDays - a.streakDays);
  };

  const getPlayersByActivities = () => {
    return [...leaderboard.players].sort((a, b) => b.completedActivities - a.completedActivities);
  };

  const getPlayersByAchievements = () => {
    return [...leaderboard.players].sort((a, b) => b.achievementsCount - a.achievementsCount);
  };

  useEffect(() => {
    if (user && userProfile?.school_id) {
      fetchLeaderboard();
    }
  }, [user, userProfile]);

  return {
    leaderboard,
    getPlayersByStreak,
    getPlayersByActivities,
    getPlayersByAchievements,
    loading,
    error,
    refetch: fetchLeaderboard
  };
};