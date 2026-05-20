import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';

export interface GameQuestion {
  id: string;
  section_id: string;
  topic_id: string;
  lesson_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  choices: { id: string; text: string }[];
  correct_answer: string;
  explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit?: number;
}

export interface GameLesson {
  id: string;
  title: string;
  content?: string;
  topic_id: string;
  topic_title: string;
  topic_order: number;
  section_id: string;
  section_title: string;
  section_order: number;
  order_index: number;
  questions: GameQuestion[];
}

export interface PlayerProgress {
  lesson_id: string;
  score: number;
  max_score: number;
  attempts: number;
  unlocked: boolean;
  completed_at?: string;
  best_time?: number;
  last_attempt_at?: string;
  mistakes_count?: number;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  unlocked_at: string;
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

export const useGrade10Game = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<GameLesson[]>([]);
  const [progress, setProgress] = useState<Record<string, PlayerProgress>>({});
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLessonsWithQuestions = async () => {
    try {
      setLoading(true);

      // Fetch hierarchy: lessons -> topics -> sections
      const { data: lessonsData, error: lessonsError } = await (supabase as any)
        .from('grade10_ka_lessons')
        .select(`
          id,
          title,
          content,
          order_index,
          topic_id,
          grade10_ka_topics!inner (
            id,
            title,
            section_id,
            order_index,
            grade10_ka_sections!inner (
              id,
              title,
              order_index
            )
          )
        `);

      if (lessonsError) throw lessonsError;

      // Fetch all questions for grade10 game
      const { data: allQuestionsData, error: questionsError } = await (supabase as any)
        .from('grade10_ka_questions')
        .select('*');

      if (questionsError) throw questionsError;

      const questionsByLesson: Record<string, any[]> = {};
      (allQuestionsData || []).forEach((question: any) => {
        if (!questionsByLesson[question.lesson_id]) {
          questionsByLesson[question.lesson_id] = [];
        }
        try {
          let parsedChoices: any[] = [];
          if (Array.isArray(question.choices)) {
            parsedChoices = question.choices;
          } else if (typeof question.choices === 'string') {
            parsedChoices = JSON.parse(question.choices);
          }

          const validatedChoices = parsedChoices.map((choice: any, index: number) => {
            if (typeof choice === 'object' && choice.id && choice.text) return choice;
            if (typeof choice === 'string') {
              return { id: String.fromCharCode(65 + index), text: choice };
            }
            return { id: String.fromCharCode(65 + index), text: String(choice) };
          });

          if (validatedChoices.length < 2) {
            logger.warn(`Question ${question.id} has invalid choices`, { choices: validatedChoices });
            return;
          }

          questionsByLesson[question.lesson_id].push({
            ...question,
            choices: validatedChoices,
            difficulty_level: question.difficulty_level as 'easy' | 'medium' | 'hard',
            time_limit: 60
          });
        } catch (error) {
          logger.error(`Error parsing question ${question.id}`, error as Error);
        }
      });

      const lessonsWithQuestions: GameLesson[] = [];
      for (const lesson of (lessonsData || []) as any[]) {
        const lessonQuestions = questionsByLesson[lesson.id] || [];
        if (lessonQuestions.length > 0) {
          // Sort questions by difficulty
          lessonQuestions.sort(
            (a, b) =>
              (DIFFICULTY_ORDER[a.difficulty_level] ?? 1) -
              (DIFFICULTY_ORDER[b.difficulty_level] ?? 1)
          );

          lessonsWithQuestions.push({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            topic_id: lesson.topic_id,
            topic_title: lesson.grade10_ka_topics.title,
            topic_order: lesson.grade10_ka_topics.order_index ?? 0,
            section_id: lesson.grade10_ka_topics.section_id,
            section_title: lesson.grade10_ka_topics.grade10_ka_sections.title,
            section_order: lesson.grade10_ka_topics.grade10_ka_sections.order_index ?? 0,
            order_index: lesson.order_index ?? 0,
            questions: lessonQuestions
          });
        }
      }

      // Hierarchical ordering: section → topic → lesson
      lessonsWithQuestions.sort((a, b) => {
        if (a.section_order !== b.section_order) return a.section_order - b.section_order;
        if (a.topic_order !== b.topic_order) return a.topic_order - b.topic_order;
        return a.order_index - b.order_index;
      });

      setLessons(lessonsWithQuestions);
    } catch (error) {
      logger.error('Error fetching grade10 game lessons', error as Error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل الدروس',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      if (!user?.id) {
        setProgress({});
        return;
      }

      const { data, error } = await (supabase as any)
        .from('grade10_ka_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      const progressMap: Record<string, PlayerProgress> = {};
      (data || []).forEach((item: any) => {
        progressMap[item.lesson_id] = {
          lesson_id: item.lesson_id,
          score: item.score,
          max_score: item.max_score,
          attempts: item.attempts,
          unlocked: item.unlocked,
          completed_at: item.completed_at
        };
      });
      setProgress(progressMap);
    } catch (error) {
      logger.error('Error fetching progress', error as Error);
    }
  };

  const fetchAchievements = async () => {
    try {
      if (!user?.id) {
        setAchievements([]);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('grade10_ka_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      logger.error('Error fetching achievements', error as Error);
    }
  };

  const updateProgress = async (
    lessonId: string,
    score: number,
    maxScore: number,
    completionTime?: number,
    mistakesCount?: number
  ) => {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: existingProgress } = await (supabase as any)
          .from('grade10_ka_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        const currentAttempts = existingProgress?.attempts || 0;
        const currentBestScore = existingProgress?.score || 0;
        const bestScore = Math.max(currentBestScore, score);
        const newAttempts = currentAttempts + 1;

        const progressData = {
          user_id: user.id,
          lesson_id: lessonId,
          score: bestScore,
          max_score: maxScore,
          attempts: newAttempts,
          unlocked: true,
          completed_at: score >= maxScore * 0.7 ? new Date().toISOString() : null
        };

        let result;
        if (existingProgress) {
          result = await (supabase as any)
            .from('grade10_ka_progress')
            .update(progressData)
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId);
        } else {
          result = await (supabase as any)
            .from('grade10_ka_progress')
            .insert(progressData);
        }

        if (result.error) throw result.error;

        const newProgressData: PlayerProgress = {
          lesson_id: lessonId,
          score: bestScore,
          max_score: maxScore,
          attempts: newAttempts,
          unlocked: true,
          completed_at: score >= maxScore * 0.7 ? new Date().toISOString() : undefined,
          best_time: completionTime,
          last_attempt_at: new Date().toISOString(),
          mistakes_count: mistakesCount || 0
        };

        setProgress(prev => ({ ...prev, [lessonId]: newProgressData }));
        await checkAchievements(lessonId, score, maxScore, completionTime, mistakesCount);
        return;
      } catch (error: any) {
        lastError = error;
        logger.warn(`Grade10 progress update attempt ${attempt} failed`, error);
        if (attempt === maxRetries || (error.code !== '23505' && !error.message?.includes('conflict'))) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }

    logger.error('Failed to save grade10 progress', lastError);
    toast({
      title: 'خطأ في حفظ النتيجة',
      description: 'يرجى المحاولة مرة أخرى أو التحقق من الاتصال',
      variant: 'destructive'
    });
    throw lastError;
  };

  const checkAchievements = async (
    lessonId: string,
    score: number,
    maxScore: number,
    completionTime?: number,
    mistakesCount?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const completedLessons = Object.values(progress).filter(p => p.completed_at).length;
      const perfectScore = score === maxScore;
      const fastCompletion = completionTime && completionTime < 120;
      const noMistakes = mistakesCount === 0;

      const newAchievements: any[] = [];
      if (completedLessons === 0) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'first_lesson',
          achievement_data: { lesson_id: lessonId, timestamp: new Date().toISOString() }
        });
      }
      if (perfectScore) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'perfect_score',
          achievement_data: { lesson_id: lessonId, score, max_score: maxScore, timestamp: new Date().toISOString() }
        });
      }
      if (fastCompletion && perfectScore) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'speed_demon',
          achievement_data: { lesson_id: lessonId, time: completionTime, timestamp: new Date().toISOString() }
        });
      }
      if (noMistakes && score >= maxScore * 0.8) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'flawless',
          achievement_data: { lesson_id: lessonId, timestamp: new Date().toISOString() }
        });
      }
      const milestones = [3, 5, 10, 15, 20];
      if (milestones.includes(completedLessons + 1)) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: `milestone_${completedLessons + 1}`,
          achievement_data: { lessons_count: completedLessons + 1, timestamp: new Date().toISOString() }
        });
      }

      for (const achievement of newAchievements) {
        const { data: existing } = await (supabase as any)
          .from('grade10_ka_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_type', achievement.achievement_type)
          .maybeSingle();
        if (!existing) {
          const { error } = await (supabase as any)
            .from('grade10_ka_achievements')
            .insert(achievement);
          if (!error) {
            toast({
              title: '🏆 إنجاز جديد!',
              description: getAchievementDescription(achievement.achievement_type),
              duration: 5000
            });
          }
        }
      }

      if (newAchievements.length > 0) fetchAchievements();
    } catch (error) {
      logger.error('Error checking achievements', error as Error);
    }
  };

  const getAchievementDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      first_lesson: 'أكملت درسك الأول! 🎓',
      perfect_score: 'حصلت على الدرجة الكاملة! ⭐',
      speed_demon: 'إكمال سريع ومثالي! ⚡',
      flawless: 'إكمال بلا أخطاء! 💎',
      milestone_3: 'أكملت 3 دروس! 🥉',
      milestone_5: 'أكملت 5 دروس! 🥈',
      milestone_10: 'أكملت 10 دروس! 🥇',
      milestone_15: 'أكملت 15 درس! 👑',
      milestone_20: 'خبير الشبكات! 🌟'
    };
    return descriptions[type] || 'إنجاز جديد! 🎉';
  };

  // Sequential unlock: card opens only after previous card is completed (>=70%)
  const isLessonUnlocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return true;
    const previousLesson = lessons[lessonIndex - 1];
    if (!previousLesson) return false;
    const previousProgress = progress[previousLesson.id];
    return previousProgress?.completed_at != null;
  };

  const getTotalStats = () => {
    const completedLessons = Object.values(progress).filter(p => p.completed_at).length;
    const totalXP = Object.values(progress).reduce((sum, p) => sum + p.score, 0);
    const level = Math.floor(totalXP / 100) + 1;
    return {
      completedLessons,
      totalLessons: lessons.length,
      totalXP,
      level,
      achievements: achievements.length
    };
  };

  useEffect(() => {
    fetchLessonsWithQuestions();
    fetchProgress();
    fetchAchievements();
  }, []);

  return {
    lessons,
    progress,
    achievements,
    loading,
    updateProgress,
    isLessonUnlocked,
    getTotalStats,
    refetch: () => {
      fetchLessonsWithQuestions();
      fetchProgress();
      fetchAchievements();
    }
  };
};
