import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

interface GameStats {
  totalPoints: number;
  completedGames: number;
  playerRank: number;
  totalPlayers: number;
}

const fetchStudentGameStats = async (userId: string, schoolId?: string): Promise<GameStats> => {
  try {
    // Get player profile to get total XP (points)
    const { data: playerProfile, error: profileError } = await supabase
      .from('grade11_player_profiles')
      .select('total_xp, level')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching player profile:', profileError);
    }

    const totalPoints = playerProfile?.total_xp || 0;

    // Get completed games count
    const { data: progressData, error: progressError } = await supabase
      .from('player_game_progress')
      .select('game_id', { count: 'exact' })
      .eq('player_id', userId)
      .eq('is_completed', true);

    const completedGames = progressData?.length || 0;

    // Calculate player rank within school
    let playerRank = 0;
    let totalPlayers = 0;

    if (schoolId) {
      const { data: rankings, error: rankError } = await supabase
        .from('grade11_player_profiles')
        .select('user_id, total_xp, profiles!inner(school_id)')
        .eq('profiles.school_id', schoolId)
        .order('total_xp', { ascending: false });

      if (!rankError && rankings) {
        totalPlayers = rankings.length;
        const userIndex = rankings.findIndex(r => r.user_id === userId);
        playerRank = userIndex >= 0 ? userIndex + 1 : 0;
      }
    }

    return {
      totalPoints,
      completedGames,
      playerRank,
      totalPlayers
    };
  } catch (error) {
    console.error('Error in fetchStudentGameStats:', error);
    return {
      totalPoints: 0,
      completedGames: 0,
      playerRank: 0,
      totalPlayers: 0
    };
  }
};

export const useStudentGameStats = () => {
  const { user, userProfile } = useAuth();

  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.GAME_STATS(user?.id || ''),
    queryFn: () => fetchStudentGameStats(user?.id || '', userProfile?.school_id),
    enabled: Boolean(user && userProfile?.role === 'student'),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: false
  });

  // Real-time updates for game progress
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('game-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_game_progress',
          filter: `player_id=eq.${user.id}`
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grade11_player_profiles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return {
    stats: stats || {
      totalPoints: 0,
      completedGames: 0,
      playerRank: 0,
      totalPlayers: 0
    },
    loading: isLoading,
    error,
    refetch
  };
};
