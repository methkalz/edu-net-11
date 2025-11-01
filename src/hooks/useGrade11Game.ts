import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useSmartDifficultySystem } from './useSmartDifficultySystem';
import { useSmartQuestionGenerator } from './useSmartQuestionGenerator';
import { useAdvancedScoring } from './useAdvancedScoring';

export interface GameQuestion {
  id: string;
  section_id: string;
  topic_id: string;
  lesson_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  choices: {id: string, text: string}[];
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
  order_index: number;
  questions: GameQuestion[];
}

export interface GameTopic {
  id: string;
  title: string;
  section_id: string;
  section_title: string;
  order_index: number;
  lessons: GameLesson[];
  questions: GameQuestion[];
  totalQuestions: number;
}

export interface Grade11LessonWithMedia {
  id: string;
  title: string;
  content?: string;
}

export interface PlayerProgress {
  topic_id: string;
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

export const useGrade11Game = () => {
  const [topics, setTopics] = useState<GameTopic[]>([]);
  const [progress, setProgress] = useState<Record<string, PlayerProgress>>({});
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // استخدام الأنظمة الذكية الجديدة
  const difficultySystem = useSmartDifficultySystem();
  const questionGenerator = useSmartQuestionGenerator();
  const advancedScoring = useAdvancedScoring();

  // Fetch topics with their lessons and questions
  const fetchTopicsWithLessons = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get topics with section info
      const { data: topicsData, error: topicsError } = await supabase
        .from('grade11_topics')
        .select(`
          id,
          title,
          order_index,
          section_id,
          grade11_sections!inner (
            id,
            title,
            order_index
          )
        `)
        .order('order_index', { ascending: true });

      if (topicsError) throw topicsError;

      // Step 2: Get all lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('grade11_lessons')
        .select('id, title, content, order_index, topic_id')
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Step 3: Get all questions
      const { data: allQuestionsData, error: questionsError } = await supabase
        .from('grade11_game_questions')
        .select('*');

      if (questionsError) throw questionsError;

      // Step 4: Process and validate questions
      const validQuestions: GameQuestion[] = [];
      (allQuestionsData || []).forEach(question => {
        try {
          let parsedChoices = [];
          
          if (Array.isArray(question.choices)) {
            parsedChoices = question.choices;
          } else if (typeof question.choices === 'string') {
            parsedChoices = JSON.parse(question.choices);
          }

          const validatedChoices = parsedChoices.map((choice: any, index: number) => {
            if (typeof choice === 'object' && choice.id && choice.text) {
              return choice;
            } else if (typeof choice === 'string') {
              return {
                id: String.fromCharCode(65 + index),
                text: choice
              };
            } else {
              return {
                id: String.fromCharCode(65 + index),
                text: String(choice)
              };
            }
          });

          if (validatedChoices.length < 2) {
            logger.warn(`Question ${question.id} has invalid choices`);
            return;
          }

          validQuestions.push({
            ...question,
            choices: validatedChoices,
            difficulty_level: question.difficulty_level as 'easy' | 'medium' | 'hard',
            question_type: question.question_type as 'multiple_choice' | 'true_false' | 'fill_blank',
            time_limit: 60
          });
        } catch (error) {
          logger.error(`Error parsing question ${question.id}`, error as Error);
        }
      });

      // Step 5: Group questions by lesson_id
      const questionsByLesson: Record<string, GameQuestion[]> = {};
      validQuestions.forEach(question => {
        if (!questionsByLesson[question.lesson_id]) {
          questionsByLesson[question.lesson_id] = [];
        }
        questionsByLesson[question.lesson_id].push(question);
      });

      // Step 6: Group lessons by topic_id
      const lessonsByTopic: Record<string, GameLesson[]> = {};
      (lessonsData || []).forEach(lesson => {
        const lessonQuestions = questionsByLesson[lesson.id] || [];
        if (lessonQuestions.length > 0) {
          if (!lessonsByTopic[lesson.topic_id]) {
            lessonsByTopic[lesson.topic_id] = [];
          }
          lessonsByTopic[lesson.topic_id].push({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            order_index: lesson.order_index,
            questions: lessonQuestions
          });
        }
      });

      // Step 7: Build topics with all their data
      const topicsWithLessons: GameTopic[] = [];
      for (const topic of topicsData || []) {
        const topicLessons = lessonsByTopic[topic.id] || [];
        
        // Collect all questions from all lessons in this topic
        const allTopicQuestions: GameQuestion[] = [];
        topicLessons.forEach(lesson => {
          allTopicQuestions.push(...lesson.questions);
        });

        // Only include topics that have questions
        if (allTopicQuestions.length > 0) {
          topicsWithLessons.push({
            id: topic.id,
            title: topic.title,
            section_id: topic.section_id,
            section_title: topic.grade11_sections.title,
            order_index: topic.order_index,
            lessons: topicLessons,
            questions: allTopicQuestions,
            totalQuestions: allTopicQuestions.length
          });
        }
      }

      setTopics(topicsWithLessons);
    } catch (error) {
      logger.error('Error fetching topics', error as Error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل المحتوى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch player progress for topics
  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_topic_progress')
        .select('*');

      if (error) throw error;

      const progressMap: Record<string, PlayerProgress> = {};
      data?.forEach(item => {
        progressMap[item.topic_id] = {
          topic_id: item.topic_id,
          score: item.score,
          max_score: item.max_score,
          attempts: item.attempts,
          unlocked: item.unlocked,
          completed_at: item.completed_at,
          best_time: item.best_time,
          last_attempt_at: item.last_attempt_at,
          mistakes_count: item.mistakes_count
        };
      });

      setProgress(progressMap);
    } catch (error) {
      logger.error('Error fetching progress', error as Error);
    }
  };

  // Fetch achievements
  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_game_achievements')
        .select('*')
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      logger.error('Error fetching achievements', error as Error);
    }
  };

// معالجة محسّنة لتحديث التقدم مع retry mechanism
  const updateProgress = async (
    topicId: string, 
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

        // جلب التقدم الحالي من قاعدة البيانات
        const { data: existingProgress } = await supabase
          .from('grade11_topic_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('topic_id', topicId)
          .maybeSingle();

        const currentAttempts = existingProgress?.attempts || 0;
        const currentBestScore = existingProgress?.score || 0;
        const bestScore = Math.max(currentBestScore, score);
        const currentBestTime = existingProgress?.best_time;
        const bestTime = completionTime && (!currentBestTime || completionTime < currentBestTime) 
          ? completionTime 
          : currentBestTime;
        const newAttempts = currentAttempts + 1;
        
        const progressData = {
          user_id: user.id,
          topic_id: topicId,
          score: bestScore,
          max_score: maxScore,
          attempts: newAttempts,
          unlocked: true,
          completed_at: score >= (maxScore * 0.7) ? new Date().toISOString() : null,
          best_time: bestTime,
          last_attempt_at: new Date().toISOString(),
          mistakes_count: mistakesCount || 0
        };

        let result;
        if (existingProgress) {
          result = await supabase
            .from('grade11_topic_progress')
            .update(progressData)
            .eq('user_id', user.id)
            .eq('topic_id', topicId);
        } else {
          result = await supabase
            .from('grade11_topic_progress')
            .insert(progressData);
        }

        if (result.error) throw result.error;

        // Update local state
        const newProgressData: PlayerProgress = {
          topic_id: topicId,
          score: bestScore,
          max_score: maxScore,
          attempts: newAttempts,
          unlocked: true,
          completed_at: score >= (maxScore * 0.7) ? new Date().toISOString() : undefined,
          best_time: bestTime,
          last_attempt_at: new Date().toISOString(),
          mistakes_count: mistakesCount || 0
        };

        setProgress(prev => ({
          ...prev,
          [topicId]: newProgressData
        }));

        // Check for achievements
        await checkAchievements(topicId, score, maxScore, completionTime, mistakesCount);

        // Auto-unlock next topic if current is completed
        if (score >= (maxScore * 0.7)) {
          unlockNextTopic(topicId);
        }

        return;

      } catch (error: any) {
        lastError = error;
        logger.warn(`Progress update attempt ${attempt} failed`, error);
        
        if (attempt === maxRetries || (error.code !== '23505' && !error.message?.includes('conflict'))) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }

    logger.error('Failed to save progress to database after all retries', lastError);
    
    toast({
      title: 'خطأ في حفظ النتيجة',
      description: 'يرجى المحاولة مرة أخرى أو التحقق من الاتصال',
      variant: 'destructive'
    });
    
    throw lastError;
  };

  // Enhanced achievements system
  const checkAchievements = async (
    topicId: string, 
    score: number, 
    maxScore: number, 
    completionTime?: number,
    mistakesCount?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const completedTopics = Object.values(progress).filter(p => p.completed_at).length;
      const perfectScore = score === maxScore;
      const fastCompletion = completionTime && completionTime < 120;
      const noMistakes = mistakesCount === 0;
      
      const newAchievements = [];

      // First topic completed
      if (completedTopics === 0) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'first_topic',
          achievement_data: { topic_id: topicId, timestamp: new Date().toISOString() }
        });
      }

      // Perfect score achievement
      if (perfectScore) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'perfect_score',
          achievement_data: { 
            topic_id: topicId, 
            score, 
            max_score: maxScore,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Speed demon (fast completion)
      if (fastCompletion && perfectScore) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'speed_demon',
          achievement_data: { 
            topic_id: topicId, 
            time: completionTime,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Flawless (no mistakes)
      if (noMistakes && score >= maxScore * 0.8) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'flawless',
          achievement_data: { 
            topic_id: topicId,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Milestone achievements
      const milestones = [3, 5, 10];
      if (milestones.includes(completedTopics + 1)) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: `milestone_${completedTopics + 1}`,
          achievement_data: { 
            topics_count: completedTopics + 1,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Insert achievements (prevent duplicates)
      for (const achievement of newAchievements) {
        // Check if achievement already exists
        const { data: existing } = await supabase
          .from('grade11_game_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_type', achievement.achievement_type)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase
            .from('grade11_game_achievements')
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

      if (newAchievements.length > 0) {
        fetchAchievements();
      }

    } catch (error) {
      logger.error('Error checking achievements', error as Error);
    }
  };

  const getAchievementDescription = (type: string) => {
    const descriptions = {
      'first_topic': 'أكملت موضوعك الأول! 🎓',
      'perfect_score': 'حصلت على الدرجة الكاملة! ⭐',
      'speed_demon': 'إكمال سريع ومثالي! ⚡',
      'flawless': 'إكمال بلا أخطاء! 💎',
      'milestone_3': 'أكملت 3 مواضيع! 🥉',
      'milestone_5': 'أكملت 5 مواضيع! 🥈',
      'milestone_10': 'أكملت 10 مواضيع! 🥇',
      'network_expert': 'خبير في الشبكات! 🔥',
      'week_streak': 'أسبوع من التعلم المتواصل! 📚'
    };
    return descriptions[type as keyof typeof descriptions] || 'إنجاز جديد! 🎉';
  };

  // Auto-unlock next topic
  const unlockNextTopic = (currentTopicId: string) => {
    const currentIndex = topics.findIndex(t => t.id === currentTopicId);
    if (currentIndex !== -1 && currentIndex < topics.length - 1) {
      const nextTopic = topics[currentIndex + 1];
      if (nextTopic && !progress[nextTopic.id]?.unlocked) {
        logger.info(`Next topic ${nextTopic.id} should be unlocked`);
      }
    }
  };

  // Check if topic is unlocked
  const isTopicUnlocked = (topicIndex: number) => {
    if (topicIndex === 0) return true; // First topic always unlocked
    
    const previousTopic = topics[topicIndex - 1];
    if (!previousTopic) return false;
    
    const previousProgress = progress[previousTopic.id];
    return previousProgress?.completed_at != null;
  };

  // Get total stats
  const getTotalStats = () => {
    const completedTopics = Object.values(progress).filter(p => p.completed_at).length;
    const totalXP = Object.values(progress).reduce((sum, p) => sum + p.score, 0);
    const level = Math.floor(totalXP / 100) + 1;
    
    return {
      completedLessons: completedTopics,
      totalLessons: topics.length,
      totalXP,
      level,
      achievements: achievements.length
    };
  };

  useEffect(() => {
    fetchTopicsWithLessons();
    fetchProgress();
    fetchAchievements();
  }, []);

  return {
    topics,
    lessons: topics, // for backward compatibility
    progress,
    achievements,
    loading,
    updateProgress,
    isTopicUnlocked,
    isLessonUnlocked: isTopicUnlocked, // for backward compatibility
    getTotalStats,
    refetch: () => {
      fetchTopicsWithLessons();
      fetchProgress();
      fetchAchievements();
    }
  };
};