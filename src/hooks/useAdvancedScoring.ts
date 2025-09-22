import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScoringConfig {
  id: string;
  config_name: string;
  base_points: number;
  time_bonus_multiplier: number;
  accuracy_multiplier: number;
  streak_bonus_points: number;
  difficulty_multipliers: {
    easy: number;
    medium: number;
    hard: number;
  };
  perfect_score_bonus: number;
  speed_completion_threshold: number;
}

export interface GameSessionResult {
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  questionDetails: Array<{
    questionId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isCorrect: boolean;
    timeSpent: number;
    hintsUsed: number;
    points: number;
  }>;
  achievements: string[];
}

export interface ScoreBreakdown {
  baseScore: number;
  difficultyBonus: number;
  timeBonus: number;
  accuracyBonus: number;
  streakBonus: number;
  perfectScoreBonus: number;
  speedBonus: number;
  totalScore: number;
  bonuses: Array<{
    type: string;
    points: number;
    description: string;
  }>;
}

export const useAdvancedScoring = () => {
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // جلب إعدادات النقاط
  const fetchScoringConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_scoring_config')
        .select('*')
        .eq('config_name', 'default')
        .single();

      if (error) throw error;
      
      // تحويل البيانات إلى النوع المطلوب
      const parsedData: ScoringConfig = {
        ...data,
        difficulty_multipliers: typeof data.difficulty_multipliers === 'string' 
          ? JSON.parse(data.difficulty_multipliers) 
          : data.difficulty_multipliers as any
      };
      
      setScoringConfig(parsedData);
    } catch (error) {
      console.error('Error fetching scoring config:', error);
      // استخدام إعدادات افتراضية في حالة الخطأ
      setScoringConfig({
        id: 'default',
        config_name: 'default',
        base_points: 10,
        time_bonus_multiplier: 1.5,
        accuracy_multiplier: 2.0,
        streak_bonus_points: 5,
        difficulty_multipliers: {
          easy: 1.0,
          medium: 1.5,
          hard: 2.0
        },
        perfect_score_bonus: 20,
        speed_completion_threshold: 120
      });
    }
  };

  // حساب النقاط المتقدم
  const calculateAdvancedScore = (sessionResult: GameSessionResult): ScoreBreakdown => {
    if (!scoringConfig) {
      throw new Error('Scoring configuration not loaded');
    }

    const { questionDetails, correctAnswers, totalQuestions, totalTime } = sessionResult;
    const bonuses: Array<{ type: string; points: number; description: string }> = [];

    // 1. النقاط الأساسية مع مضاعفات الصعوبة
    let baseScore = 0;
    let difficultyBonus = 0;

    questionDetails.forEach(question => {
      const basePoints = scoringConfig.base_points;
      const difficultyMultiplier = scoringConfig.difficulty_multipliers[question.difficulty];
      const questionScore = basePoints * difficultyMultiplier;
      
      if (question.isCorrect) {
        baseScore += basePoints;
        const bonusPoints = basePoints * (difficultyMultiplier - 1);
        difficultyBonus += bonusPoints;
      }
    });

    // 2. مكافأة الدقة
    const accuracy = correctAnswers / totalQuestions;
    const accuracyBonus = Math.round(baseScore * (accuracy - 0.5) * scoringConfig.accuracy_multiplier);
    
    if (accuracyBonus > 0) {
      bonuses.push({
        type: 'accuracy',
        points: accuracyBonus,
        description: `مكافأة الدقة (${Math.round(accuracy * 100)}%)`
      });
    }

    // 3. مكافأة السرعة
    const averageTimePerQuestion = totalTime / totalQuestions;
    let timeBonus = 0;
    
    if (averageTimePerQuestion < scoringConfig.speed_completion_threshold) {
      const speedRatio = scoringConfig.speed_completion_threshold / averageTimePerQuestion;
      timeBonus = Math.round(baseScore * (speedRatio - 1) * scoringConfig.time_bonus_multiplier);
      
      bonuses.push({
        type: 'speed',
        points: timeBonus,
        description: `مكافأة السرعة (${Math.round(averageTimePerQuestion)}ث لكل سؤال)`
      });
    }

    // 4. مكافأة السجل المتتالي (أكثر من 3 إجابات صحيحة متتالية)
    let streakBonus = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    questionDetails.forEach(question => {
      if (question.isCorrect) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    if (maxStreak >= 3) {
      streakBonus = Math.floor(maxStreak / 3) * scoringConfig.streak_bonus_points;
      bonuses.push({
        type: 'streak',
        points: streakBonus,
        description: `مكافأة السجل المتتالي (${maxStreak} إجابات صحيحة متتالية)`
      });
    }

    // 5. مكافأة الدرجة الكاملة
    let perfectScoreBonus = 0;
    if (accuracy === 1.0) {
      perfectScoreBonus = scoringConfig.perfect_score_bonus;
      bonuses.push({
        type: 'perfect',
        points: perfectScoreBonus,
        description: 'مكافأة الدرجة الكاملة'
      });
    }

    // 6. مكافأة السرعة الاستثنائية (أقل من نصف الوقت المحدد)
    let speedBonus = 0;
    if (averageTimePerQuestion < scoringConfig.speed_completion_threshold / 2 && accuracy >= 0.8) {
      speedBonus = Math.round(baseScore * 0.5);
      bonuses.push({
        type: 'lightning',
        points: speedBonus,
        description: 'مكافأة البرق ⚡'
      });
    }

    // 7. مكافأة عدم استخدام التلميحات
    const noHintsBonus = questionDetails.every(q => q.hintsUsed === 0) ? 
      Math.round(baseScore * 0.2) : 0;
    
    if (noHintsBonus > 0) {
      bonuses.push({
        type: 'no_hints',
        points: noHintsBonus,
        description: 'مكافأة عدم استخدام التلميحات'
      });
    }

    // حساب النقاط الإجمالية
    const totalScore = baseScore + difficultyBonus + accuracyBonus + timeBonus + 
                      streakBonus + perfectScoreBonus + speedBonus + noHintsBonus;

    return {
      baseScore,
      difficultyBonus,
      timeBonus,
      accuracyBonus,
      streakBonus,
      perfectScoreBonus,
      speedBonus,
      totalScore,
      bonuses
    };
  };

  // حساب النقاط لسؤال واحد
  const calculateQuestionScore = (
    difficulty: 'easy' | 'medium' | 'hard',
    isCorrect: boolean,
    timeSpent: number,
    hintsUsed: number,
    timeLimit: number = 60
  ): number => {
    if (!scoringConfig || !isCorrect) return 0;

    const basePoints = scoringConfig.base_points;
    const difficultyMultiplier = scoringConfig.difficulty_multipliers[difficulty];
    let score = basePoints * difficultyMultiplier;

    // مكافأة السرعة للسؤال الواحد
    if (timeSpent <= timeLimit * 0.5) {
      score *= 1.2; // مكافأة 20% للإجابة السريعة
    }

    // خصم نقاط لاستخدام التلميحات
    score -= hintsUsed * 2;

    return Math.max(1, Math.round(score)); // حد أدنى نقطة واحدة
  };

  // تحديد مستوى الأداء
  const getPerformanceLevel = (scoreBreakdown: ScoreBreakdown): {
    level: string;
    title: string;
    color: string;
    description: string;
  } => {
    const { totalScore, baseScore } = scoreBreakdown;
    const scoreRatio = totalScore / Math.max(baseScore, 1);

    if (scoreRatio >= 3.0) {
      return {
        level: 'legendary',
        title: 'أسطوري',
        color: '#FFD700',
        description: 'أداء استثنائي وفريد! 🌟'
      };
    } else if (scoreRatio >= 2.5) {
      return {
        level: 'master',
        title: 'خبير',
        color: '#9333EA',
        description: 'أداء متميز جداً! 👑'
      };
    } else if (scoreRatio >= 2.0) {
      return {
        level: 'expert',
        title: 'متقدم',
        color: '#DC2626',
        description: 'أداء متقدم ممتاز! 🔥'
      };
    } else if (scoreRatio >= 1.5) {
      return {
        level: 'advanced',
        title: 'متوسط متقدم',
        color: '#EA580C',
        description: 'أداء جيد جداً! 💪'
      };
    } else if (scoreRatio >= 1.2) {
      return {
        level: 'good',
        title: 'جيد',
        color: '#16A34A',
        description: 'أداء جيد، استمر! ✨'
      };
    } else {
      return {
        level: 'beginner',
        title: 'مبتدئ',
        color: '#6B7280',
        description: 'بداية جيدة، يمكنك التحسن! 📚'
      };
    }
  };

  // حساب النقاط مع مراعاة الصعوبة التكيفية
  const calculateAdaptiveScore = (
    sessionResult: GameSessionResult,
    playerHistory: {
      averageAccuracy: number;
      averageTime: number;
      recentScores: number[];
    }
  ): ScoreBreakdown & { adaptiveMultiplier: number } => {
    const baseScoreBreakdown = calculateAdvancedScore(sessionResult);
    
    // حساب مضاعف التكيف بناءً على الأداء السابق
    let adaptiveMultiplier = 1.0;
    
    // إذا كان الأداء أفضل من المتوسط، زيادة المكافأة
    const currentAccuracy = sessionResult.correctAnswers / sessionResult.totalQuestions;
    const currentAvgTime = sessionResult.totalTime / sessionResult.totalQuestions;
    
    if (currentAccuracy > playerHistory.averageAccuracy) {
      adaptiveMultiplier += 0.1;
    }
    
    if (currentAvgTime < playerHistory.averageTime) {
      adaptiveMultiplier += 0.1;
    }
    
    // مكافأة التحسن المستمر
    if (playerHistory.recentScores.length >= 3) {
      const isImproving = playerHistory.recentScores.slice(-3).every((score, index, arr) => 
        index === 0 || score >= arr[index - 1]
      );
      
      if (isImproving) {
        adaptiveMultiplier += 0.15;
      }
    }
    
    const adaptedTotalScore = Math.round(baseScoreBreakdown.totalScore * adaptiveMultiplier);
    
    return {
      ...baseScoreBreakdown,
      totalScore: adaptedTotalScore,
      adaptiveMultiplier
    };
  };

  // توليد ملخص الأداء
  const generatePerformanceReport = (scoreBreakdown: ScoreBreakdown, sessionResult: GameSessionResult) => {
    const performanceLevel = getPerformanceLevel(scoreBreakdown);
    const accuracy = sessionResult.correctAnswers / sessionResult.totalQuestions;
    const avgTimePerQuestion = sessionResult.totalTime / sessionResult.totalQuestions;
    
    return {
      performance: performanceLevel,
      statistics: {
        accuracy: Math.round(accuracy * 100),
        avgTime: Math.round(avgTimePerQuestion),
        totalQuestions: sessionResult.totalQuestions,
        correctAnswers: sessionResult.correctAnswers,
        totalScore: scoreBreakdown.totalScore
      },
      recommendations: generateRecommendations(accuracy, avgTimePerQuestion, scoreBreakdown),
      achievements: sessionResult.achievements
    };
  };

  // توليد التوصيات
  const generateRecommendations = (accuracy: number, avgTime: number, scoreBreakdown: ScoreBreakdown): string[] => {
    const recommendations: string[] = [];
    
    if (accuracy < 0.6) {
      recommendations.push('راجع المفاهيم الأساسية قبل المتابعة');
      recommendations.push('تدرب على أسئلة أسهل لبناء الثقة');
    } else if (accuracy >= 0.9) {
      recommendations.push('أداء ممتاز! جرب أسئلة أكثر صعوبة');
      recommendations.push('ساعد زملاءك في فهم المفاهيم');
    }
    
    if (avgTime > 120) {
      recommendations.push('حاول تحسين سرعة الإجابة دون التضحية بالدقة');
      recommendations.push('مارس المزيد لتصبح أكثر ثقة');
    } else if (avgTime < 30) {
      recommendations.push('تأكد من قراءة الأسئلة بعناية');
      recommendations.push('خذ وقتك في التفكير قبل الإجابة');
    }
    
    if (scoreBreakdown.bonuses.length === 0) {
      recommendations.push('حاول تحسين السرعة والدقة للحصول على نقاط إضافية');
    }
    
    return recommendations;
  };

  useEffect(() => {
    const initializeScoring = async () => {
      setLoading(true);
      await fetchScoringConfig();
      setLoading(false);
    };

    initializeScoring();
  }, []);

  return {
    scoringConfig,
    loading,
    calculateAdvancedScore,
    calculateQuestionScore,
    calculateAdaptiveScore,
    getPerformanceLevel,
    generatePerformanceReport,
    refetch: fetchScoringConfig
  };
};