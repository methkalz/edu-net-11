import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TIMES } from '@/lib/query-keys';

export interface LinkedGame {
  id: string;
  title: string;
  level_number: number;
  stage_number: number;
}

export interface GameState {
  game: LinkedGame;
  isLocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  remainingPrereqs: number;
}

export interface LessonGamesResult {
  games: GameState[];
  loading: boolean;
}

const fetchTopicGames = async (topicId: string): Promise<GameState[]> => {
  // 1. Get all linked games from grade11_content_games
  const { data: linkData, error: linkError } = await supabase
    .from('grade11_content_games')
    .select('game_id')
    .eq('topic_id', topicId)
    .eq('is_active', true);

  if (linkError || !linkData || linkData.length === 0) return [];

  const gameIds = linkData.map(l => l.game_id);

  // 2. Get game details for all linked games
  const { data: gamesData, error: gamesError } = await supabase
    .from('pair_matching_games')
    .select('id, title, level_number, stage_number')
    .in('id', gameIds)
    .eq('is_active', true)
    .order('level_number')
    .order('stage_number');

  if (gamesError || !gamesData || gamesData.length === 0) return [];

  // 3. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return gamesData.map(game => ({
      game,
      isLocked: true,
      isCompleted: false,
      bestScore: 0,
      remainingPrereqs: 0,
    }));
  }

  // 4. Get player progress for all these games
  const { data: progressData } = await (supabase as any)
    .from('player_game_progress')
    .select('game_id, is_unlocked, is_completed, best_score')
    .eq('player_id', user.id)
    .in('game_id', gameIds);

  const progressMap = new Map(
    (progressData || []).map((p: any) => [p.game_id, p])
  );

  // 5. For prerequisite calculation, get all games before the highest level in our set
  const maxLevel = Math.max(...gamesData.map(g => g.level_number));
  const { data: allGames } = await (supabase as any)
    .from('pair_matching_games')
    .select('id, level_number, stage_number')
    .eq('is_active', true)
    .lt('level_number', maxLevel + 1);

  // 6. Get completed games for the user
  const allGameIds = (allGames || []).map((g: any) => g.id);
  let completedIds = new Set<string>();
  if (allGameIds.length > 0) {
    const { data: completedGames } = await (supabase as any)
      .from('player_game_progress')
      .select('game_id')
      .eq('player_id', user.id)
      .eq('is_completed', true)
      .in('game_id', allGameIds);
    completedIds = new Set((completedGames || []).map((g: any) => g.game_id));
  }

  // 7. Build state for each game
  return gamesData.map(game => {
    const progress = progressMap.get(game.id) as any;

    // Calculate remaining prerequisites
    const prevGames = (allGames || []).filter((g: any) =>
      g.level_number < game.level_number ||
      (g.level_number === game.level_number && g.stage_number < game.stage_number)
    );
    const remainingPrereqs = prevGames.filter((g: any) => !completedIds.has(g.id)).length;

    const isUnlocked = progress?.is_unlocked ?? (game.level_number === 1 && game.stage_number === 1);
    const isCompleted = progress?.is_completed ?? false;

    return {
      game,
      isLocked: !isUnlocked,
      isCompleted,
      bestScore: progress?.best_score ?? 0,
      remainingPrereqs,
    };
  });
};

export const useLessonGames = (topicId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['lesson-games', topicId],
    queryFn: () => fetchTopicGames(topicId),
    enabled: !!topicId,
    staleTime: 30_000,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    games: data ?? [],
    loading: isLoading,
  };
};

// Backward compatibility
export const useLessonGame = (topicId: string) => {
  const { games, loading } = useLessonGames(topicId);
  const first = games[0];
  return {
    linkedGame: first?.game ?? null,
    isLocked: first?.isLocked ?? false,
    isCompleted: first?.isCompleted ?? false,
    bestScore: first?.bestScore ?? 0,
    remainingPrereqs: first?.remainingPrereqs ?? 0,
    loading,
  };
};
