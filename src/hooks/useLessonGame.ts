import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TIMES } from '@/lib/query-keys';

export interface LinkedGame {
  id: string;
  title: string;
  level_number: number;
  stage_number: number;
}

export interface LessonGameState {
  linkedGame: LinkedGame | null;
  isLocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  remainingPrereqs: number;
  loading: boolean;
}

const fetchTopicGame = async (topicId: string): Promise<LessonGameState | null> => {
  // 1. Get linked game from grade11_content_games
  const { data: linkData, error: linkError } = await supabase
    .from('grade11_content_games')
    .select('game_id')
    .eq('topic_id', topicId)
    .eq('is_active', true)
    .maybeSingle();

  if (linkError || !linkData?.game_id) return null;

  // 2. Get game details
  const { data: gameData, error: gameError } = await supabase
    .from('pair_matching_games')
    .select('id, title, level_number, stage_number')
    .eq('id', linkData.game_id)
    .eq('is_active', true)
    .maybeSingle();

  if (gameError || !gameData) return null;

  // 3. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      linkedGame: gameData,
      isLocked: true,
      isCompleted: false,
      bestScore: 0,
      remainingPrereqs: 0,
      loading: false,
    };
  }

  // 4. Get player progress for this specific game
  const { data: progressData } = await (supabase as any)
    .from('player_game_progress')
    .select('is_unlocked, is_completed, best_score')
    .eq('player_id', user.id)
    .eq('game_id', gameData.id)
    .maybeSingle();

  // 5. Calculate prerequisites - count incomplete games before this one
  const { data: allGames } = await (supabase as any)
    .from('pair_matching_games')
    .select('id, level_number, stage_number')
    .eq('is_active', true)
    .lt('level_number', gameData.level_number + 1);

  let remainingPrereqs = 0;
  if (allGames && allGames.length > 0) {
    const prevGameIds = allGames
      .filter((g: any) => g.level_number < gameData.level_number || (g.level_number === gameData.level_number && g.stage_number < gameData.stage_number))
      .map((g: any) => g.id);

    if (prevGameIds.length > 0) {
      const { data: completedGames } = await (supabase as any)
        .from('player_game_progress')
        .select('game_id')
        .eq('player_id', user.id)
        .eq('is_completed', true)
        .in('game_id', prevGameIds);

      const completedIds = new Set((completedGames || []).map((g: any) => g.game_id));
      remainingPrereqs = prevGameIds.filter((id: string) => !completedIds.has(id)).length;
    }
  }


  const isUnlocked = progressData?.is_unlocked ?? (gameData.level_number === 1 && gameData.stage_number === 1);
  const isCompleted = progressData?.is_completed ?? false;

  return {
    linkedGame: gameData,
    isLocked: !isUnlocked,
    isCompleted,
    bestScore: progressData?.best_score ?? 0,
    remainingPrereqs,
    loading: false,
  };
};

export const useLessonGame = (topicId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['lesson-game', topicId],
    queryFn: () => fetchTopicGame(topicId),
    enabled: !!topicId,
    staleTime: 30_000,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    linkedGame: data?.linkedGame ?? null,
    isLocked: data?.isLocked ?? false,
    isCompleted: data?.isCompleted ?? false,
    bestScore: data?.bestScore ?? 0,
    remainingPrereqs: data?.remainingPrereqs ?? 0,
    loading: isLoading,
  };
};
