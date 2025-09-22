import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type LessonLevel = 'basic' | 'intermediate' | 'advanced';

export interface DifficultyConfig {
  id: string;
  lesson_id: string;
  lesson_level: LessonLevel;
  questions_per_session: number;
  easy_percentage: number;
  medium_percentage: number;
  hard_percentage: number;
  min_score_to_pass: number;
}

export interface PlayerAnalytics {
  user_id: string;
  lesson_id: string;
  session_data: any;
  learning_pattern: any;
  weak_areas: string[];
  strong_areas: string[];
  preferred_question_types: string[];
  optimal_session_length?: number;
  recommendation_data: any;
}

export const useSmartDifficultySystem = () => {
  const [difficultyConfigs, setDifficultyConfigs] = useState<Record<string, DifficultyConfig>>({});
  const [analytics, setAnalytics] = useState<Record<string, PlayerAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // جلب إعدادات الصعوبة للدروس
  const fetchDifficultyConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_lesson_difficulty_config')
        .select('*');

      if (error) throw error;

      const configsMap: Record<string, DifficultyConfig> = {};
      data?.forEach(config => {
        configsMap[config.lesson_id] = {
          ...config,
          lesson_level: config.lesson_level as LessonLevel
        };
      });

      setDifficultyConfigs(configsMap);
    } catch (error) {
      console.error('Error fetching difficulty configs:', error);
    }
  };

  // جلب تحليلات اللاعب
  const fetchPlayerAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('grade11_player_analytics')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const analyticsMap: Record<string, PlayerAnalytics> = {};
      data?.forEach(analytic => {
        analyticsMap[analytic.lesson_id] = {
          ...analytic,
          weak_areas: Array.isArray(analytic.weak_areas) ? analytic.weak_areas : JSON.parse(analytic.weak_areas as string || '[]'),
          strong_areas: Array.isArray(analytic.strong_areas) ? analytic.strong_areas : JSON.parse(analytic.strong_areas as string || '[]'),
          preferred_question_types: Array.isArray(analytic.preferred_question_types) ? analytic.preferred_question_types : JSON.parse(analytic.preferred_question_types as string || '[]')
        };
      });

      setAnalytics(analyticsMap);
    } catch (error) {
      console.error('Error fetching player analytics:', error);
    }
  };

  // تحديد مستوى الصعوبة الذكي للدرس
  const getDifficultyConfig = (lessonId: string, playerProgress?: any): DifficultyConfig => {
    const existingConfig = difficultyConfigs[lessonId];
    const playerAnalytic = analytics[lessonId];

    // إذا وجد تكوين مخصص، استخدمه
    if (existingConfig) {
      return existingConfig;
    }

    // حساب مستوى الصعوبة بناءً على أداء اللاعب
    let lessonLevel: LessonLevel = 'basic';
    let questionsPerSession = 5;
    let easyPercentage = 60;
    let mediumPercentage = 30;
    let hardPercentage = 10;

    if (playerAnalytic && playerProgress) {
      const avgScore = playerProgress.score / playerProgress.max_score;
      const attempts = playerProgress.attempts;

      // تكيف الصعوبة بناءً على الأداء
      if (avgScore >= 0.9 && attempts >= 3) {
        lessonLevel = 'advanced';
        questionsPerSession = 8;
        easyPercentage = 20;
        mediumPercentage = 40;
        hardPercentage = 40;
      } else if (avgScore >= 0.7 && attempts >= 2) {
        lessonLevel = 'intermediate';
        questionsPerSession = 6;
        easyPercentage = 30;
        mediumPercentage = 50;
        hardPercentage = 20;
      }
    }

    return {
      id: '',
      lesson_id: lessonId,
      lesson_level: lessonLevel,
      questions_per_session: questionsPerSession,
      easy_percentage: easyPercentage,
      medium_percentage: mediumPercentage,
      hard_percentage: hardPercentage,
      min_score_to_pass: 70
    };
  };

  // حفظ أو تحديث إعدادات الصعوبة
  const saveDifficultyConfig = async (lessonId: string, config: Partial<DifficultyConfig>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fullConfig = {
        lesson_id: lessonId,
        lesson_level: config.lesson_level || 'basic',
        ...config
      };

      const { data, error } = await supabase
        .from('grade11_lesson_difficulty_config')
        .upsert(fullConfig)
        .select()
        .single();

      if (error) throw error;

      setDifficultyConfigs(prev => ({
        ...prev,
        [lessonId]: {
          ...data,
          lesson_level: data.lesson_level as LessonLevel
        }
      }));

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الصعوبة بنجاح'
      });

    } catch (error) {
      console.error('Error saving difficulty config:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ إعدادات الصعوبة',
        variant: 'destructive'
      });
    }
  };

  // تحليل أداء اللاعب وحفظ البيانات
  const analyzePlayerPerformance = async (
    lessonId: string, 
    sessionData: any, 
    performance: {
      correctAnswers: number;
      totalQuestions: number;
      timeSpent: number;
      questionTypes: string[];
      mistakes: any[];
    }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingAnalytic = analytics[lessonId];
      
      // تحليل نقاط القوة والضعف
      const accuracy = performance.correctAnswers / performance.totalQuestions;
      const avgTimePerQuestion = performance.timeSpent / performance.totalQuestions;
      
      const weakAreas: string[] = [];
      const strongAreas: string[] = [];
      
      // تحليل الأخطاء لتحديد نقاط الضعف
      performance.mistakes.forEach(mistake => {
        if (mistake.topic && !weakAreas.includes(mistake.topic)) {
          weakAreas.push(mistake.topic);
        }
      });

      // تحديد نقاط القوة (المواضيع بدون أخطاء)
      const topicsWithoutMistakes = sessionData.topics?.filter((topic: string) => 
        !performance.mistakes.some(mistake => mistake.topic === topic)
      ) || [];
      
      strongAreas.push(...topicsWithoutMistakes);

      // حساب أنماط التعلم
      const learningPattern = {
        accuracy_trend: existingAnalytic?.learning_pattern?.accuracy_trend || [],
        time_trend: existingAnalytic?.learning_pattern?.time_trend || [],
        preferred_difficulty: accuracy >= 0.8 ? 'increase' : accuracy < 0.6 ? 'decrease' : 'maintain'
      };

      // إضافة البيانات الجديدة للاتجاهات
      learningPattern.accuracy_trend.push(accuracy);
      learningPattern.time_trend.push(avgTimePerQuestion);

      // الاحتفاظ بآخر 10 جلسات فقط
      if (learningPattern.accuracy_trend.length > 10) {
        learningPattern.accuracy_trend = learningPattern.accuracy_trend.slice(-10);
      }
      if (learningPattern.time_trend.length > 10) {
        learningPattern.time_trend = learningPattern.time_trend.slice(-10);
      }

      // تحديد الطول الأمثل للجلسة
      const optimalSessionLength = Math.max(5, Math.min(15, Math.round(performance.timeSpent / 60)));

      // إنشاء توصيات
      const recommendations = {
        focus_areas: weakAreas.slice(0, 3),
        suggested_difficulty: learningPattern.preferred_difficulty,
        recommended_session_length: optimalSessionLength,
        study_tips: generateStudyTips(accuracy, avgTimePerQuestion, weakAreas)
      };

      const analyticsData = {
        user_id: user.id,
        lesson_id: lessonId,
        session_data: {
          ...sessionData,
          last_session: {
            timestamp: new Date().toISOString(),
            performance
          }
        },
        learning_pattern: learningPattern,
        weak_areas: weakAreas,
        strong_areas: strongAreas,
        preferred_question_types: performance.questionTypes,
        optimal_session_length: optimalSessionLength,
        recommendation_data: recommendations
      };

      const { data, error } = await supabase
        .from('grade11_player_analytics')
        .upsert(analyticsData)
        .select()
        .single();

      if (error) throw error;

      setAnalytics(prev => ({
        ...prev,
        [lessonId]: {
          ...data,
          weak_areas: Array.isArray(data.weak_areas) ? data.weak_areas : JSON.parse(data.weak_areas as string || '[]'),
          strong_areas: Array.isArray(data.strong_areas) ? data.strong_areas : JSON.parse(data.strong_areas as string || '[]'),
          preferred_question_types: Array.isArray(data.preferred_question_types) ? data.preferred_question_types : JSON.parse(data.preferred_question_types as string || '[]')
        }
      }));

    } catch (error) {
      console.error('Error analyzing player performance:', error);
    }
  };

  // توليد نصائح دراسية
  const generateStudyTips = (accuracy: number, avgTime: number, weakAreas: string[]): string[] => {
    const tips: string[] = [];

    if (accuracy < 0.6) {
      tips.push('راجع المفاهيم الأساسية قبل المتابعة');
      tips.push('خذ وقتك في قراءة الأسئلة بعناية');
    } else if (accuracy > 0.9) {
      tips.push('أداء ممتاز! يمكنك الانتقال لمستوى أصعب');
    }

    if (avgTime > 120) {
      tips.push('حاول تحسين سرعة الإجابة دون التضحية بالدقة');
    } else if (avgTime < 30) {
      tips.push('قد تحتاج لقضاء وقت أكثر في التفكير بالإجابات');
    }

    if (weakAreas.length > 0) {
      tips.push(`ركز على تقوية فهمك في: ${weakAreas.join(', ')}`);
    }

    return tips;
  };

  // الحصول على توصيات شخصية للطالب
  const getPersonalizedRecommendations = (lessonId: string) => {
    const analytic = analytics[lessonId];
    if (!analytic) return null;

    return analytic.recommendation_data;
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDifficultyConfigs(),
        fetchPlayerAnalytics()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  return {
    difficultyConfigs,
    analytics,
    loading,
    getDifficultyConfig,
    saveDifficultyConfig,
    analyzePlayerPerformance,
    getPersonalizedRecommendations,
    refetch: () => {
      fetchDifficultyConfigs();
      fetchPlayerAnalytics();
    }
  };
};