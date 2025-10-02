import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStudentAssignedGrade } from './useStudentAssignedGrade';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

interface GameStats {
  totalPoints: number;
  completedGames: number;
  playerRank: number;
  totalPlayers: number;
}

const fetchStudentGameStats = async (userId: string, schoolId?: string, assignedGrade?: string): Promise<GameStats> => {
  try {
    let totalPoints = 0;
    let completedGames = 0;

    if (assignedGrade === '10') {
      // للصف العاشر: حساب من grade10_game_progress
      const { data: progressData } = await supabase
        .from('grade10_game_progress')
        .select('lesson_id')
        .eq('player_id', userId)
        .eq('is_completed', true);

      // عدد الدروس الفريدة المكتملة
      const uniqueCompletedLessons = new Set(progressData?.map(p => p.lesson_id) || []);
      completedGames = uniqueCompletedLessons.size;

      // للصف العاشر، النقاط تأتي من get_student_total_points
      const { data: pointsData } = await supabase
        .rpc('get_student_total_points', { student_uuid: userId });
      totalPoints = pointsData || 0;
    } else {
      // للصف الحادي عشر: المنطق الأصلي
      const { data: playerProfile, error: profileError } = await supabase
        .from('grade11_player_profiles')
        .select('total_xp, level')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching player profile:', profileError);
      }

      totalPoints = playerProfile?.total_xp || 0;

      const { data: progressData, error: progressError } = await supabase
        .from('player_game_progress')
        .select('game_id', { count: 'exact' })
        .eq('player_id', userId)
        .eq('is_completed', true);

      completedGames = progressData?.length || 0;
    }

    // Calculate player rank within school
    let playerRank = 0;
    let totalPlayers = 0;

    if (schoolId && assignedGrade === '11') {
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
  const { assignedGrade } = useStudentAssignedGrade();

  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.GAME_STATS(user?.id || ''),
    queryFn: () => fetchStudentGameStats(user?.id || '', userProfile?.school_id, assignedGrade),
    enabled: Boolean(user && userProfile?.role === 'student' && assignedGrade),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: false
  });

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
