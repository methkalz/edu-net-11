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
  time_limit?: number; // وقت محدد للسؤال بالثواني
}

export interface GameLesson {
  id: string;
  title: string;
  content?: string;
  topic_id: string;
  topic_title: string;
  section_id: string;
  section_title: string;
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
  best_time?: number; // أفضل وقت بالثواني
  last_attempt_at?: string;
  mistakes_count?: number; // عدد الأخطاء
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  unlocked_at: string;
}

export const useGrade11Game = () => {
  const [lessons, setLessons] = useState<GameLesson[]>([]);
  const [progress, setProgress] = useState<Record<string, PlayerProgress>>({});
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // استخدام الأنظمة الذكية الجديدة
  const difficultySystem = useSmartDifficultySystem();
  const questionGenerator = useSmartQuestionGenerator();
  const advancedScoring = useAdvancedScoring();

  // دمج الأسئلة المولدة مع الأسئلة التقليدية
  const [enhancedLessons, setEnhancedLessons] = useState<GameLesson[]>([]);

  // Fetch lessons with questions
  const fetchLessonsWithQuestions = async () => {
    try {
      setLoading(true);
      
      // Get lessons with section and topic info
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('grade11_lessons')
        .select(`
          id,
          title,
          content,
          order_index,
          topic_id,
          grade11_topics!inner (
            id,
            title,
            section_id,
            order_index,
            grade11_sections!inner (
              id,
              title,
              order_index
            )
          )
        `)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Get questions for each lesson
      const lessonsWithQuestions: GameLesson[] = [];
      
      // جلب جميع الأسئلة مرة واحدة
      const { data: allQuestionsData, error: questionsError } = await supabase
        .from('grade11_game_questions')
        .select('*');

      if (questionsError) throw questionsError;

      // تجميع الأسئلة حسب lesson_id
      const questionsByLesson: Record<string, any[]> = {};
      (allQuestionsData || []).forEach(question => {
        if (!questionsByLesson[question.lesson_id]) {
          questionsByLesson[question.lesson_id] = [];
        }
        // التحقق من سلامة البيانات وتطهيرها
        try {
          let parsedChoices = [];
          
          if (Array.isArray(question.choices)) {
            // إذا كانت البيانات array، تحقق من تنسيقها
            parsedChoices = question.choices;
          } else if (typeof question.choices === 'string') {
            // إذا كانت string، حاول تحويلها لـ JSON
            parsedChoices = JSON.parse(question.choices);
          }

          // التأكد من أن الخيارات بالتنسيق الصحيح {id, text}
          const validatedChoices = parsedChoices.map((choice: any, index: number) => {
            if (typeof choice === 'object' && choice.id && choice.text) {
              return choice; // التنسيق صحيح
            } else if (typeof choice === 'string') {
              // تحويل النص البسيط إلى التنسيق الصحيح
              return {
                id: String.fromCharCode(65 + index), // A, B, C, D
                text: choice
              };
            } else {
              // تنسيق غير مفهوم
              return {
                id: String.fromCharCode(65 + index),
                text: String(choice)
              };
            }
          });

          // التأكد من وجود choices صالحة
          if (validatedChoices.length < 2) {
            logger.warn(`Question ${question.id} has invalid choices`, { choices: validatedChoices });
            return; // تخطي هذا السؤال
          }

          questionsByLesson[question.lesson_id].push({
            ...question,
            choices: validatedChoices,
            difficulty_level: question.difficulty_level as 'easy' | 'medium' | 'hard',
            time_limit: 60 // وقت افتراضي 60 ثانية
          });
        } catch (error) {
          logger.error(`Error parsing question ${question.id}`, error as Error);
          // تخطي السؤال المعطوب
        }
      });

      // إنشاء قائمة الدروس مع الأسئلة
      for (const lesson of lessonsData || []) {
        // إظهار الدروس التي لديها أسئلة فقط
        const lessonQuestions = questionsByLesson[lesson.id] || [];
        if (lessonQuestions.length > 0) {
          lessonsWithQuestions.push({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            topic_id: lesson.topic_id,
            topic_title: lesson.grade11_topics.title,
            section_id: lesson.grade11_topics.section_id,
            section_title: lesson.grade11_topics.grade11_sections.title,
            order_index: lesson.order_index,
            questions: lessonQuestions
          });
        }
      }

      setLessons(lessonsWithQuestions);
    } catch (error) {
      logger.error('Error fetching lessons', error as Error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل الدروس',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch player progress
  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_game_progress')
        .select('*');

      if (error) throw error;

      const progressMap: Record<string, PlayerProgress> = {};
      data?.forEach(item => {
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

        // جلب التقدم الحالي من قاعدة البيانات للتأكد من البيانات الحديثة
        const { data: existingProgress } = await supabase
          .from('grade11_game_progress')
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
          completed_at: score >= (maxScore * 0.7) ? new Date().toISOString() : null
        };

        let result;
        if (existingProgress) {
          // إذا كان السجل موجود، استخدم UPDATE
          result = await supabase
            .from('grade11_game_progress')
            .update(progressData)
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId);
        } else {
          // إذا لم يكن موجود، استخدم INSERT
          result = await supabase
            .from('grade11_game_progress')
            .insert(progressData);
        }

        if (result.error) throw result.error;

        // Update local state
        const newProgressData: PlayerProgress = {
          lesson_id: lessonId,
          score: bestScore,
          max_score: maxScore,
          attempts: newAttempts,
          unlocked: true,
          completed_at: score >= (maxScore * 0.7) ? new Date().toISOString() : undefined,
          best_time: completionTime,
          last_attempt_at: new Date().toISOString(),
          mistakes_count: mistakesCount || 0
        };

        setProgress(prev => ({
          ...prev,
          [lessonId]: newProgressData
        }));

        // Check for achievements
        await checkAchievements(lessonId, score, maxScore, completionTime, mistakesCount);

        // Auto-unlock next lesson if current is completed
        if (score >= (maxScore * 0.7)) {
          unlockNextLesson(lessonId);
        }

        // نجح التحديث، اخرج من الـ loop
        return;

      } catch (error: any) {
        lastError = error;
        logger.warn(`Progress update attempt ${attempt} failed`, error);
        
        // إذا كانت هذه المحاولة الأخيرة، أو إذا كان الخطأ ليس مؤقتاً
        if (attempt === maxRetries || (error.code !== '23505' && !error.message?.includes('conflict'))) {
          break;
        }
        
        // انتظر قبل المحاولة التالية
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }

    // إذا فشلت جميع المحاولات
    logger.error('Failed to save progress to database after all retries', lastError);
    
    toast({
      title: 'خطأ في حفظ النتيجة',
      description: 'يرجى المحاولة مرة أخرى أو التحقق من الاتصال',
      variant: 'destructive'
    });
    
    // لا نحفظ التقدم محلياً - نطلب من المستخدم المحاولة مرة أخرى
    throw lastError;
  };

  // Enhanced achievements system
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
      const fastCompletion = completionTime && completionTime < 120; // أقل من دقيقتين
      const noMistakes = mistakesCount === 0;
      
      const newAchievements = [];

      // First lesson completed
      if (completedLessons === 0) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'first_lesson',
          achievement_data: { lesson_id: lessonId, timestamp: new Date().toISOString() }
        });
      }

      // Perfect score achievement
      if (perfectScore) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: 'perfect_score',
          achievement_data: { 
            lesson_id: lessonId, 
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
            lesson_id: lessonId, 
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
            lesson_id: lessonId,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Milestone achievements
      const milestones = [3, 5, 10, 15, 20];
      if (milestones.includes(completedLessons + 1)) {
        newAchievements.push({
          user_id: user.id,
          achievement_type: `milestone_${completedLessons + 1}`,
          achievement_data: { 
            lessons_count: completedLessons + 1,
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
      'first_lesson': 'أكملت درسك الأول! 🎓',
      'perfect_score': 'حصلت على الدرجة الكاملة! ⭐',
      'speed_demon': 'إكمال سريع ومثالي! ⚡',
      'flawless': 'إكمال بلا أخطاء! 💎',
      'milestone_3': 'أكملت 3 دروس! 🥉',
      'milestone_5': 'أكملت 5 دروس! 🥈',
      'milestone_10': 'أكملت 10 دروس! 🥇',
      'milestone_15': 'أكملت 15 درس! 👑',
      'milestone_20': 'خبير الشبكات! 🌟',
      'network_expert': 'خبير في الشبكات! 🔥',
      'week_streak': 'أسبوع من التعلم المتواصل! 📚'
    };
    return descriptions[type as keyof typeof descriptions] || 'إنجاز جديد! 🎉';
  };

  // Auto-unlock next lesson
  const unlockNextLesson = (currentLessonId: string) => {
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      if (nextLesson && !progress[nextLesson.id]?.unlocked) {
        // Auto unlock logic could be added here
        logger.info(`Next lesson ${nextLesson.id} should be unlocked`);
      }
    }
  };

  // Check if lesson is unlocked
  const isLessonUnlocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return true; // First lesson always unlocked
    
    const previousLesson = lessons[lessonIndex - 1];
    if (!previousLesson) return false;
    
    const previousProgress = progress[previousLesson.id];
    return previousProgress?.completed_at != null;
  };

  // Get total stats
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