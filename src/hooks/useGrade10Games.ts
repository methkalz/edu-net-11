import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface Grade10Game {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Grade10PairMatchingGame {
  id: string;
  title: string;
  description?: string;
  grade_level: string;
  subject?: string;
  difficulty_level?: string;
  level_number?: number;
  stage_number?: number;
  max_pairs?: number;
  time_limit_seconds?: number;
  is_active: boolean;
  created_at?: string;
}

const fetchGrade10Games = async (): Promise<{ games: Grade10Game[], pairMatchingGames: Grade10PairMatchingGame[] }> => {
  try {
    // Fetch general games for grade 10
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('grade_level', '10')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (gamesError) {
      logger.error('Error fetching grade 10 games:', gamesError);
      throw gamesError;
    }

    // Fetch pair matching games for grade 10
    const { data: pairMatchingData, error: pairMatchingError } = await supabase
      .from('pair_matching_games')
      .select('*')
      .eq('grade_level', '10')
      .eq('is_active', true)
      .order('level_number', { ascending: true })
      .order('stage_number', { ascending: true });

    if (pairMatchingError) {
      logger.error('Error fetching grade 10 pair matching games:', pairMatchingError);
      throw pairMatchingError;
    }

    logger.info('Grade 10 games fetched successfully', { 
      gamesCount: gamesData?.length || 0,
      pairMatchingCount: pairMatchingData?.length || 0
    });

    return {
      games: gamesData || [],
      pairMatchingGames: pairMatchingData || []
    };
  } catch (error) {
    logger.error('Error in fetchGrade10Games:', error);
    throw error;
  }
};

export const useGrade10Games = () => {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['grade10-games'],
    queryFn: fetchGrade10Games,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  const games = data?.games || [];
  const pairMatchingGames = data?.pairMatchingGames || [];
  const allGames = [...games, ...pairMatchingGames];
  const totalGames = allGames.length;

  return {
    games,
    pairMatchingGames,
    allGames,
    totalGames,
    loading: isLoading,
    error: error?.message || null,
    refetch
  };
};