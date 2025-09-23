import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

export interface PairMatchingGame {
  id: string;
  title: string;
  description?: string;
  grade_level: string;
  subject: string;
  difficulty_level: string;
  max_pairs: number;
  time_limit_seconds: number;
  is_active: boolean;
  level_number: number;
  stage_number: number;
}

export interface MatchingPair {
  id: string;
  game_id: string;
  left_content: string;
  right_content: string;
  left_type: string;
  right_type: string;
  explanation?: string;
  order_index: number;
}

export interface MatchingSession {
  id: string;
  game_id: string;
  player_id: string;
  status: string;
  score: number;
  max_score: number;
  completion_time?: number;
  mistakes_count: number;
  pairs_matched: number;
  started_at: string;
  completed_at?: string;
  session_data: any;
}

export interface PlayerProgress {
  id: string;
  player_id: string;
  game_id: string;
  is_unlocked: boolean;
  is_completed: boolean;
  best_score: number;
  completion_count: number;
  first_completed_at?: string;
  last_played_at?: string;
}

export interface GameWithProgress extends PairMatchingGame {
  progress?: PlayerProgress;
  isLocked: boolean;
  isCompleted: boolean;
}

interface MatchedPair {
  leftId: string;
  rightId: string;
  pairId: string;
  isCorrect: boolean;
  matchNumber?: number;
  matchColor?: string;
}

export const usePairMatching = (gameId?: string) => {
  const [games, setGames] = useState<GameWithProgress[]>([]);
  const [currentGame, setCurrentGame] = useState<PairMatchingGame | null>(null);
  const [pairs, setPairs] = useState<MatchingPair[]>([]);
  const [educationalContent, setEducationalContent] = useState<{
    section_title?: string;
    section_order?: number;
  } | null>(null);
  const [session, setSession] = useState<MatchingSession | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [shuffledPairs, setShuffledPairs] = useState<{
    leftItems: Array<{id: string, content: string, type: string, pairId: string}>;
    rightItems: Array<{id: string, content: string, type: string, pairId: string}>;
  }>({ leftItems: [], rightItems: [] });
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [nextUnlockedGame, setNextUnlockedGame] = useState<GameWithProgress | null>(null);
  const [nextCardGame, setNextCardGame] = useState<GameWithProgress | null>(null);
  const [isNewLevelUnlocked, setIsNewLevelUnlocked] = useState(false);

  const { toast } = useToast();
  const gameAudio = useGameAudio();
  const backgroundMusic = useBackgroundMusic();

  // تهيئة التقدم للمستخدم الجديد
  const initializePlayerProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('initialize_player_progress', {
        p_player_id: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error initializing player progress:', error);
    }
  }, []);

  // جلب الألعاب مع التقدم
  const fetchGamesWithProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // جلب الألعاب
      const { data: gamesData, error: gamesError } = await supabase
        .from('pair_matching_games')
        .select('*')
        .eq('is_active', true)
        .order('level_number', { ascending: true })
        .order('stage_number', { ascending: true });

      if (gamesError) throw gamesError;

      // جلب التقدم
      const { data: progressData, error: progressError } = await supabase
        .from('player_game_progress')
        .select('*')
        .eq('player_id', user.id);

      if (progressError) throw progressError;

      // دمج البيانات
      const gamesWithProgress: GameWithProgress[] = (gamesData || []).map(game => {
        const progress = progressData?.find(p => p.game_id === game.id);
        return {
          ...game,
          progress,
          isLocked: !progress?.is_unlocked || false, // تصحيح منطق القفل - إذا لم يوجد تقدم فاللعبة مقفلة
          isCompleted: progress?.is_completed || false
        };
      });

      setGames(gamesWithProgress);
    } catch (error) {
      console.error('Error fetching games with progress:', error);
      toast({
        title: 'خطأ في تحميل الألعاب',
        description: 'حدث خطأ أثناء تحميل ألعاب المطابقة',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // تحديث التقدم وفتح الألعاب التالية
  const updateProgressAndUnlockNext = useCallback(async (gameId: string, finalScore: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // الحصول على معلومات اللعبة المكتملة
      const { data: completedGameData, error: completedGameError } = await supabase
        .from('pair_matching_games')
        .select('level_number, stage_number')
        .eq('id', gameId)
        .single();

      if (completedGameError) throw completedGameError;

      // تحديث التقدم
      const { error: updateError } = await supabase
        .from('player_game_progress')
        .upsert({
          player_id: user.id,
          game_id: gameId,
          is_unlocked: true,
          is_completed: true,
          best_score: finalScore,
          completion_count: 1,
          first_completed_at: new Date().toISOString(),
          last_played_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'player_id,game_id'
        });

      if (updateError) throw updateError;

      // فتح الألعاب التالية
      const { error: unlockError } = await supabase.rpc('unlock_next_games', {
        p_player_id: user.id,
        p_completed_game_id: gameId
      });

      if (unlockError) throw unlockError;

      // إعادة جلب الألعاب مع التقدم المحدث
      await fetchGamesWithProgress();

      // البحث عن اللعبة التالية المفتوحة حديثاً
      const { data: nextGameData, error: nextGameError } = await supabase
        .from('player_game_progress')
        .select(`
          *,
          pair_matching_games (*)
        `)
        .eq('player_id', user.id)
        .eq('is_unlocked', true)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      // تحديد نوع الفتح: مستوى جديد أم بطاقة جديدة
      if (!nextGameError && nextGameData && nextGameData.length > 0) {
        const nextGameProgress = nextGameData[0];
        const nextGame = nextGameProgress.pair_matching_games as any;
        
        if (nextGame) {
          // التحقق من عدد المراحل في المستوى المكتمل
          const { data: stagesInLevel, error: stagesError } = await supabase
            .from('pair_matching_games')
            .select('stage_number')
            .eq('level_number', completedGameData.level_number)
            .eq('is_active', true)
            .order('stage_number', { ascending: true });

          if (!stagesError && stagesInLevel) {
            const totalStagesInLevel = stagesInLevel.length;
            const isLastStageInLevel = completedGameData.stage_number === totalStagesInLevel;
            const isNewLevel = nextGame.level_number > completedGameData.level_number;

            // تعيين المتغيرات حسب نوع الفتح
            const nextGameWithProgress = {
              ...nextGame,
              progress: nextGameProgress,
              isLocked: false,
              isCompleted: false
            };

            if (isLastStageInLevel && isNewLevel) {
              // فتح مستوى جديد
              setIsNewLevelUnlocked(true);
              setNextUnlockedGame(nextGameWithProgress); // للرسالة الذهبية ومعاينة المستوى
              setNextCardGame(nextGameWithProgress); // للتنقل للبطاقة التالية
            } else {
              // فتح بطاقة جديدة في نفس المستوى
              setIsNewLevelUnlocked(false);
              setNextUnlockedGame(null); // لا نعرض الرسالة الذهبية
              setNextCardGame(nextGameWithProgress); // لكن نعرض زر التنقل للبطاقة التالية
            }
          }
        }
      } else {
        // لا توجد ألعاب أخرى للفتح
        setIsNewLevelUnlocked(false);
        setNextUnlockedGame(null);
        setNextCardGame(null);
      }

    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'خطأ في تحديث التقدم',
        description: 'حدث خطأ أثناء تحديث التقدم',
        variant: 'destructive'
      });
    }
  }, [fetchGamesWithProgress, toast]);

  // جلب كلمات المطابقة للعبة معينة
  const fetchPairs = useCallback(async (gameId: string) => {
    try {
      setLoading(true);
      
      // جلب جميع كلمات المطابقة للعبة
      const { data: allPairsData, error: pairsError } = await supabase
        .from('pair_matching_pairs')
        .select('*')
        .eq('game_id', gameId)
        .order('order_index', { ascending: true });

      if (pairsError) throw pairsError;
      
      // تحديد عدد الكلمات بناءً على مستوى الصعوبة
      const availablePairs = allPairsData || [];
      
      // جلب معلومات اللعبة لتحديد مستوى الصعوبة
      const { data: gameData, error: gameError } = await supabase
        .from('pair_matching_games')
        .select('difficulty_level, title, max_pairs, level_number')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('خطأ في جلب معلومات اللعبة:', gameError);
        throw gameError;
      }

      let targetPairs: number;
      
      // تحديد عدد الكلمات حسب level_number
      if (gameData.level_number === 1) {
        targetPairs = 4;
      } else if (gameData.level_number === 2) {
        targetPairs = 5;
      } else {
        // المستوى الثالث وما فوق
        targetPairs = 6;
      }
      
      let selectedPairs = availablePairs;
      
      // إذا كان هناك أكثر من العدد المطلوب، اختر العدد المحدد بشكل عشوائي
      if (availablePairs.length > targetPairs) {
        const shuffledPairs = [...availablePairs].sort(() => Math.random() - 0.5);
        selectedPairs = shuffledPairs.slice(0, targetPairs);
      }
      // إذا كان هناك أقل من العدد المطلوب، استخدم جميع الكلمات المتاحة
      else if (availablePairs.length < targetPairs) {
        console.warn(`عدد الكلمات أقل من المطلوب: ${availablePairs.length} من ${targetPairs} للمستوى ${gameData.title}`);
        selectedPairs = availablePairs;
      }
      
      console.log(`تم اختيار ${selectedPairs.length} كلمات من أصل ${availablePairs.length}`);
      
      // جلب معلومات المحتوى التعليمي المرتبط باللعبة
      const { data: contentLink, error: contentError } = await supabase
        .from('grade11_content_games')
        .select(`
          *,
          grade11_sections (title),
          grade11_topics (title),
          grade11_lessons (title)
        `)
        .eq('game_id', gameId)
        .eq('is_active', true)
        .single();

      if (!contentError && contentLink) {
        setEducationalContent({
          section_title: contentLink.grade11_sections?.title,
          section_order: 1 // يمكن إضافة ترتيب القسم لاحقاً إذا احتجناه
        });
      } else {
        setEducationalContent(null);
      }

      setPairs(selectedPairs);

      // خلط الكلمات المختارة
      if (selectedPairs && selectedPairs.length > 0) {
        const leftItems = selectedPairs.map((pair, index) => ({
          id: `left-${pair.id}`,
          content: pair.left_content,
          type: pair.left_type,
          pairId: pair.id,
          originalIndex: index
        }));

        const rightItems = selectedPairs.map((pair, index) => ({
          id: `right-${pair.id}`,
          content: pair.right_content,
          type: pair.right_type,
          pairId: pair.id,
          originalIndex: index
        }));

        // خلط العناصر بطريقة أفضل لضمان التنوع
        const shuffledLeft = [...leftItems].sort(() => Math.random() - 0.5);
        const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);

        setShuffledPairs({
          leftItems: shuffledLeft,
          rightItems: shuffledRight
        });
        
        console.log('تم خلط الكلمات:', {
          leftItems: shuffledLeft.length,
          rightItems: shuffledRight.length,
          selectedPairsCount: selectedPairs.length
        });
      }
    } catch (error) {
      console.error('Error fetching pairs:', error);
      toast({
        title: 'خطأ في تحميل الكلمات',
        description: 'حدث خطأ أثناء تحميل كلمات المطابقة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // بدء جلسة جديدة
  const startNewSession = useCallback(async (gameId: string) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) throw new Error('اللعبة غير موجودة');

      // تحديد العدد الصحيح للكلمات حسب المستوى
      let pairsCount: number;
      if (game.level_number === 1) {
        pairsCount = 4;
      } else if (game.level_number === 2) {
        pairsCount = 5;
      } else {
        pairsCount = 6;
      }

      const { data: sessionData, error } = await supabase
        .from('pair_matching_sessions')
        .insert({
          game_id: gameId,
          player_id: (await supabase.auth.getUser()).data.user?.id,
          max_score: pairsCount * 10, // 10 نقاط لكل زوج بناءً على العدد الصحيح
          session_data: {}
        })
        .select()
        .single();

      if (error) throw error;

      setSession(sessionData);
      setCurrentGame(game);
      setScore(0);
      setMistakes(0);
      setMatchedPairs([]);
      setSelectedLeft(null);
      setSelectedRight(null);
      setTimeRemaining(game.time_limit_seconds);
      setIsGameActive(true);

      await fetchPairs(gameId);

      // تشغيل صوت بداية اللعبة
      gameAudio.playGameStart();
      
      // تشغيل الموسيقى الخلفية
      backgroundMusic.playBackgroundMusic();

      toast({
        title: 'بدأت اللعبة!',
        description: `لديك ${Math.floor(game.time_limit_seconds / 60)} دقائق لمطابقة ${pairsCount} كلمات`
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'خطأ في بدء اللعبة',
        description: 'حدث خطأ أثناء بدء جلسة اللعبة',
        variant: 'destructive'
      });
    }
  }, [games, fetchPairs, toast]);

  // محاولة مطابقة
  const attemptMatch = useCallback(async (leftId: string, rightId: string) => {
    if (!session || !currentGame) return;

    // البحث عن الزوج الصحيح
    const leftItem = shuffledPairs.leftItems.find(item => item.id === leftId);
    const rightItem = shuffledPairs.rightItems.find(item => item.id === rightId);

    if (!leftItem || !rightItem) return;

    const isCorrect = leftItem.pairId === rightItem.pairId;
    const matchTime = currentGame.time_limit_seconds - timeRemaining;

    try {
      // حفظ النتيجة في قاعدة البيانات
      const { error: resultError } = await supabase
        .from('pair_matching_results')
        .insert({
          session_id: session.id,
          pair_id: leftItem.pairId,
          is_correct: isCorrect,
          time_taken: matchTime,
          attempts_count: 1
        });

      if (resultError) throw resultError;

      if (isCorrect) {
        // مطابقة صحيحة
        const matchColors = [
          'hsl(var(--match-color-1))',
          'hsl(var(--match-color-2))',
          'hsl(var(--match-color-3))',
          'hsl(var(--match-color-4))',
          'hsl(var(--match-color-5))',
          'hsl(var(--match-color-6))',
          'hsl(var(--match-color-7))',
          'hsl(var(--match-color-8))',
        ];
        
        const matchNumber = matchedPairs.length + 1;
        const matchColor = matchColors[(matchNumber - 1) % matchColors.length];
        
        const newMatch: MatchedPair = {
          leftId,
          rightId,
          pairId: leftItem.pairId,
          isCorrect: true,
          matchNumber,
          matchColor
        };

        setMatchedPairs(prev => [...prev, newMatch]);
        setScore(prev => prev + 10);

        // التحقق من اكتمال اللعبة قبل تشغيل الصوت
        const isLastMatch = matchedPairs.length + 1 === pairs.length;
        
        // تشغيل الصوت المناسب
        if (isLastMatch) {
          gameAudio.playGameComplete(); // صوت الفوز للمطابقة الأخيرة
        } else {
          gameAudio.playCorrectMatch(); // صوت المطابقة العادي
        }

        const pair = pairs.find(p => p.id === leftItem.pairId);
        
        toast({
          title: 'مطابقة صحيحة! 🎉',
          description: pair?.explanation || 'أحسنت!',
          variant: 'default'
        });

        // التحقق من اكتمال اللعبة
        if (matchedPairs.length + 1 === pairs.length) {
          await completeGame();
        }
      } else {
        // مطابقة خاطئة
        setMistakes(prev => prev + 1);
        
        // تشغيل صوت المطابقة الخاطئة
        gameAudio.playIncorrectMatch();
        
        toast({
          title: 'مطابقة خاطئة 😅',
          description: 'حاول مرة أخرى!',
          variant: 'destructive'
        });
      }

      // إعادة تعيين التحديد
      setSelectedLeft(null);
      setSelectedRight(null);
    } catch (error) {
      console.error('Error recording match attempt:', error);
      toast({
        title: 'خطأ في حفظ النتيجة',
        description: 'حدث خطأ أثناء حفظ النتيجة',
        variant: 'destructive'
      });
    }
  }, [session, currentGame, shuffledPairs, pairs, matchedPairs, timeRemaining, toast]);

  // إنهاء اللعبة
  const completeGame = useCallback(async () => {
    if (!session || !currentGame) return;

    try {
      const completionTime = currentGame.time_limit_seconds - timeRemaining;

      const { error } = await supabase
        .from('pair_matching_sessions')
        .update({
          status: 'completed',
          score,
          completion_time: completionTime,
          mistakes_count: mistakes,
          pairs_matched: matchedPairs.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      setIsGameActive(false);

      // إيقاف الموسيقى الخلفية
      backgroundMusic.stopBackgroundMusic();

      // تشغيل صوت إكمال اللعبة
      gameAudio.playGameComplete();

      // تحديث التقدم وفتح الألعاب التالية
      await updateProgressAndUnlockNext(currentGame.id, score);

      toast({
        title: 'تم إكمال اللعبة! 🎊',
        description: `النتيجة النهائية: ${score} نقطة في ${Math.floor(completionTime / 60)} دقيقة`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error completing game:', error);
      toast({
        title: 'خطأ في إنهاء اللعبة',
        description: 'حدث خطأ أثناء حفظ نتيجة اللعبة',
        variant: 'destructive'
      });
    }
  }, [session, currentGame, timeRemaining, score, mistakes, matchedPairs.length, updateProgressAndUnlockNext, toast]);

  // عداد الوقت
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isGameActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsGameActive(false);
            // إيقاف الموسيقى الخلفية عند انتهاء الوقت
            backgroundMusic.stopBackgroundMusic();
            completeGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameActive, timeRemaining, completeGame]);

  // تحميل الألعاب عند بدء التشغيل
  useEffect(() => {
    const initializeAndLoadGames = async () => {
      await initializePlayerProgress();
      await fetchGamesWithProgress();
    };
    
    initializeAndLoadGames();
  }, [initializePlayerProgress, fetchGamesWithProgress]);

  // تحميل لعبة محددة
  useEffect(() => {
    if (gameId && games.length > 0) {
      const game = games.find(g => g.id === gameId);
      if (game) {
        setCurrentGame(game);
        fetchPairs(gameId);
      }
    }
  }, [gameId, games, fetchPairs]);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      backgroundMusic.cleanup();
    };
  }, [backgroundMusic.cleanup]);

  return {
    // البيانات
    games,
    currentGame,
    pairs,
    session,
    shuffledPairs,
    matchedPairs,
    score,
    mistakes,
    timeRemaining,
    isGameActive,
    loading,
    selectedLeft,
    selectedRight,
    nextUnlockedGame,
    nextCardGame,
    isNewLevelUnlocked,

    // الأفعال
    startNewSession,
    attemptMatch,
    completeGame,
    setSelectedLeft,
    setSelectedRight,
    fetchGamesWithProgress,
    fetchPairs,
    initializePlayerProgress,
    updateProgressAndUnlockNext,

    // المساعدات
    isMatched: (itemId: string) => matchedPairs.some(match => 
      match.leftId === itemId || match.rightId === itemId
    ),
    getMatchedPair: (itemId: string) => matchedPairs.find(match => 
      match.leftId === itemId || match.rightId === itemId
    ),
    canMatch: (leftId: string, rightId: string) => {
      const leftMatched = matchedPairs.some(match => match.leftId === leftId);
      const rightMatched = matchedPairs.some(match => match.rightId === rightId);
      return !leftMatched && !rightMatched;
    },
    
    // نظام الصوت
    gameAudio
  };
};