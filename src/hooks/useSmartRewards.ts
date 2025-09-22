import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface RewardCalculation {
  shouldReward: boolean;
  coinsEarned: number;
  xpEarned: number;
  rewardType: string;
  message: string;
  description: string;
  capReached?: boolean;
  remainingCoins?: number;
  remainingXP?: number;
}

export interface LessonRewardData {
  lessonId: string;
  score: number;
  maxScore: number;
  completionTime?: number;
  mistakesCount: number;
}

interface LessonRewardCap {
  id: string;
  user_id: string;
  lesson_id: string;
  total_coins_earned: number;
  total_xp_earned: number;
  max_coins_allowed: number;
  max_xp_allowed: number;
  completion_count: number;
  first_completion_at: string | null;
  last_reward_at: string | null;
}

// إعدادات النظام
const DEFAULT_MAX_COINS = 100; // الحد الأقصى للعملات لكل درس
const DEFAULT_MAX_XP = 200; // الحد الأقصى للخبرة لكل درس
const BASE_COINS_MULTIPLIER = 0.5; // 50% من النقاط
const BASE_XP_MULTIPLIER = 1; // 100% من النقاط

export const useSmartRewards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // الحصول على معلومات حد المكافآت للدرس
  const getLessonRewardCap = useCallback(async (lessonId: string): Promise<LessonRewardCap | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('grade11_lesson_completion_caps')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting lesson reward cap', error);
      return null;
    }
  }, [user]);

  // إنشاء أو تحديث حد المكافآت للدرس
  const createOrUpdateLessonCap = useCallback(async (
    lessonId: string, 
    coinsToAdd: number, 
    xpToAdd: number,
    isFirstCompletion: boolean = false
  ): Promise<LessonRewardCap | null> => {
    if (!user) return null;

    try {
      const existingCap = await getLessonRewardCap(lessonId);
      
      if (existingCap) {
        // تحديث الحد الموجود
        const updatedData = {
          total_coins_earned: existingCap.total_coins_earned + coinsToAdd,
          total_xp_earned: existingCap.total_xp_earned + xpToAdd,
          completion_count: existingCap.completion_count + 1,
          last_reward_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('grade11_lesson_completion_caps')
          .update(updatedData)
          .eq('id', existingCap.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // إنشاء حد جديد
        const newCapData = {
          user_id: user.id,
          lesson_id: lessonId,
          total_coins_earned: coinsToAdd,
          total_xp_earned: xpToAdd,
          max_coins_allowed: DEFAULT_MAX_COINS,
          max_xp_allowed: DEFAULT_MAX_XP,
          completion_count: 1,
          first_completion_at: isFirstCompletion ? new Date().toISOString() : null,
          last_reward_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('grade11_lesson_completion_caps')
          .insert(newCapData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      logger.error('Error creating/updating lesson cap', error);
      return null;
    }
  }, [user, getLessonRewardCap]);

  // الحصول على أفضل نتيجة سابقة للدرس
  const getBestScore = useCallback(async (lessonId: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase
        .from('grade11_lesson_rewards')
        .select('score')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.score || 0;
    } catch (error) {
      logger.error('Error getting best score', error);
      return 0;
    }
  }, [user]);

  // حساب المكافأة الذكية مع فرض الحد الأقصى
  const calculateSmartReward = useCallback(async (data: LessonRewardData): Promise<RewardCalculation> => {
    if (!user) {
      return {
        shouldReward: false,
        coinsEarned: 0,
        xpEarned: 0,
        rewardType: 'no_user',
        message: 'غير مسجل الدخول',
        description: 'يجب تسجيل الدخول للحصول على المكافآت'
      };
    }

    try {
      setLoading(true);

      const { lessonId, score, maxScore, completionTime, mistakesCount } = data;
      const percentage = (score / maxScore) * 100;

      // النتيجة ضعيفة (أقل من 70%)
      if (percentage < 70) {
        return {
          shouldReward: false,
          coinsEarned: 0,
          xpEarned: 0,
          rewardType: 'low_score',
          message: '📚 تحتاج لتحسين النتيجة',
          description: 'احصل على 70% أو أكثر للحصول على المكافآت. حاول مرة أخرى!'
        };
      }

      // الحصول على معلومات الحد الأقصى
      const lessonCap = await getLessonRewardCap(lessonId);
      const bestScore = await getBestScore(lessonId);
      const isFirstCompletion = bestScore === 0;

      // التحقق من الوصول للحد الأقصى المطلق
      if (lessonCap) {
        const coinsRemaining = lessonCap.max_coins_allowed - lessonCap.total_coins_earned;
        const xpRemaining = lessonCap.max_xp_allowed - lessonCap.total_xp_earned;

        // إذا تم استنفاد كامل الحد الأقصى
        if (coinsRemaining <= 0 && xpRemaining <= 0) {
          return {
            shouldReward: false,
            coinsEarned: 0,
            xpEarned: 0,
            rewardType: 'cap_reached',
            message: '🔒 استنفدت كامل مكافآت هذا الدرس',
            description: 'لقد حصلت على الحد الأقصى من العملات والخبرة من هذا الدرس. جرب دروساً أخرى لكسب مكافآت جديدة!',
            capReached: true,
            remainingCoins: 0,
            remainingXP: 0
          };
        }
      }

      let coinsEarned = Math.floor(score * BASE_COINS_MULTIPLIER);
      let xpEarned = Math.floor(score * BASE_XP_MULTIPLIER);
      let rewardType = '';
      let message = '';
      let description = '';

      // تحديد نوع المكافأة
      if (isFirstCompletion) {
        // الإكمال الأول - مكافأة كاملة
        rewardType = 'first_completion';
        message = '🎉 أول إكمال ناجح!';
        description = `تهانينا على إكمال الدرس لأول مرة!`;
      } else if (score > bestScore && ((score - bestScore) / maxScore) >= 0.1) {
        // تحسن كبير - 50% من المكافأة
        coinsEarned = Math.floor(coinsEarned * 0.5);
        xpEarned = Math.floor(xpEarned * 0.5);
        rewardType = 'improvement';
        message = '📈 تحسن رائع في النتيجة!';
        description = `حسنت نتيجتك من ${bestScore} إلى ${score}!`;
      } else {
        // التحقق من عدم وجود تحسن حقيقي
        const improvementPercentage = bestScore > 0 ? ((score - bestScore) / maxScore) * 100 : 0;
        
        // إذا لم يكن هناك تحسن حقيقي (أقل من 10% تحسن)
        if (score <= bestScore || improvementPercentage < 10) {
          return {
            shouldReward: false,
            coinsEarned: 0,
            xpEarned: 0,
            rewardType: 'no_improvement',
            message: '🔄 لا مكافآت - لا تحسن',
            description: score === bestScore 
              ? 'حصلت على نفس النتيجة السابقة. حاول تحسين أدائك للحصول على مكافآت!'
              : 'التحسن في النتيجة قليل جداً. حاول الحصول على تحسن أكبر للحصول على مكافآت!',
            capReached: false
          };
        }

        // التحقق من الإنجازات الخاصة (فقط مع التحسن)
        let specialBonus = false;
        let bonusReasons = [];

        if (score === maxScore && score > bestScore) {
          bonusReasons.push('نتيجة مثالية');
          specialBonus = true;
        }

        if (completionTime && completionTime < 120 && score > bestScore) {
          bonusReasons.push('إكمال سريع');
          specialBonus = true;
        }

        if (mistakesCount === 0 && score > bestScore) {
          bonusReasons.push('بدون أخطاء');
          specialBonus = true;
        }

        if (specialBonus) {
          coinsEarned = Math.floor(coinsEarned * 0.25);
          xpEarned = Math.floor(xpEarned * 0.25);
          rewardType = 'special_achievement';
          message = '⭐ إنجاز خاص!';
          description = `${bonusReasons.join(' + ')}!`;
        } else {
          // تحسن عادي
          coinsEarned = Math.floor(coinsEarned * 0.3);
          xpEarned = Math.floor(xpEarned * 0.3);
          rewardType = 'minor_improvement';
          message = '📈 تحسن طفيف!';
          description = `تحسنت نتيجتك من ${bestScore} إلى ${score}!`;
        }
      }

      // تطبيق الحد الأقصى على المكافآت
      let finalCoins = coinsEarned;
      let finalXP = xpEarned;
      let capMessage = '';

      if (lessonCap) {
        const coinsRemaining = lessonCap.max_coins_allowed - lessonCap.total_coins_earned;
        const xpRemaining = lessonCap.max_xp_allowed - lessonCap.total_xp_earned;

        // تقييد العملات
        if (finalCoins > coinsRemaining) {
          finalCoins = Math.max(0, coinsRemaining);
          capMessage += ` (محدود بالحد الأقصى للعملات)`;
        }

        // تقييد الخبرة
        if (finalXP > xpRemaining) {
          finalXP = Math.max(0, xpRemaining);
          capMessage += ` (محدود بالحد الأقصى للخبرة)`;
        }

        description += ` ${finalCoins} عملة + ${finalXP} خبرة${capMessage}`;

        return {
          shouldReward: true,
          coinsEarned: finalCoins,
          xpEarned: finalXP,
          rewardType,
          message,
          description,
          capReached: (coinsRemaining <= finalCoins && xpRemaining <= finalXP),
          remainingCoins: Math.max(0, coinsRemaining - finalCoins),
          remainingXP: Math.max(0, xpRemaining - finalXP)
        };
      } else {
        description += ` ${finalCoins} عملة + ${finalXP} خبرة`;

        return {
          shouldReward: true,
          coinsEarned: finalCoins,
          xpEarned: finalXP,
          rewardType,
          message,
          description,
          remainingCoins: DEFAULT_MAX_COINS - finalCoins,
          remainingXP: DEFAULT_MAX_XP - finalXP
        };
      }

    } catch (error) {
      logger.error('Error calculating smart reward', error);
      return {
        shouldReward: true,
        coinsEarned: 0,
        xpEarned: Math.max(1, Math.floor(data.score * 0.1)),
        rewardType: 'fallback',
        message: '⚠️ خطأ في النظام',
        description: 'حدث خطأ في حساب المكافأة. حاول مرة أخرى.'
      };
    } finally {
      setLoading(false);
    }
  }, [user, getLessonRewardCap, getBestScore]);

  // تسجيل المكافأة مع تحديث الحد الأقصى
  const recordReward = useCallback(async (
    data: LessonRewardData,
    reward: RewardCalculation,
    previousBestScore: number
  ) => {
    if (!user || !reward.shouldReward) return;

    try {
      // تسجيل المكافأة في جدول المكافآت
      const rewardRecord = {
        user_id: user.id,
        lesson_id: data.lessonId,
        reward_type: reward.rewardType,
        score: data.score,
        max_score: data.maxScore,
        completion_time: data.completionTime,
        mistakes_count: data.mistakesCount,
        coins_earned: reward.coinsEarned,
        xp_earned: reward.xpEarned,
        previous_best_score: previousBestScore
      };

      const { error: rewardError } = await supabase
        .from('grade11_lesson_rewards')
        .insert(rewardRecord);

      if (rewardError) throw rewardError;

      // تحديث الحد الأقصى للدرس
      const isFirstCompletion = previousBestScore === 0;
      await createOrUpdateLessonCap(
        data.lessonId, 
        reward.coinsEarned, 
        reward.xpEarned,
        isFirstCompletion
      );

      logger.info('Reward recorded with cap update', { 
        userId: user.id, 
        lessonId: data.lessonId, 
        rewardType: reward.rewardType,
        coins: reward.coinsEarned,
        xp: reward.xpEarned,
        capReached: reward.capReached
      });

    } catch (error) {
      logger.error('Error recording reward', error);
    }
  }, [user, createOrUpdateLessonCap]);

  // الدالة الرئيسية للحصول على المكافأة الذكية
  const processSmartReward = useCallback(async (data: LessonRewardData) => {
    const previousBestScore = await getBestScore(data.lessonId);
    const reward = await calculateSmartReward(data);
    
    // تسجيل المكافآت فقط إذا كانت حقيقية وإيجابية
    if (reward.shouldReward === true && reward.coinsEarned > 0 && reward.xpEarned > 0) {
      await recordReward(data, reward, previousBestScore);
    }

    return reward;
  }, [calculateSmartReward, recordReward, getBestScore]);

  // إحصائيات المكافآت والحدود
  const getRewardStats = useCallback(async () => {
    if (!user) return null;

    try {
      const [rewardStats, capStats] = await Promise.all([
        supabase
          .from('grade11_lesson_rewards')
          .select('coins_earned, xp_earned, reward_type, lesson_id')
          .eq('user_id', user.id),
        
        supabase
          .from('grade11_lesson_completion_caps')
          .select('lesson_id, total_coins_earned, total_xp_earned, max_coins_allowed, max_xp_allowed, completion_count')
          .eq('user_id', user.id)
      ]);

      const totalCoins = rewardStats.data?.reduce((sum, r) => sum + r.coins_earned, 0) || 0;
      const totalXP = rewardStats.data?.reduce((sum, r) => sum + r.xp_earned, 0) || 0;
      
      const rewardTypes = rewardStats.data?.reduce((acc, r) => {
        acc[r.reward_type] = (acc[r.reward_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const lessonProgress = capStats.data?.map(cap => ({
        lessonId: cap.lesson_id,
        coinsProgress: (cap.total_coins_earned / cap.max_coins_allowed) * 100,
        xpProgress: (cap.total_xp_earned / cap.max_xp_allowed) * 100,
        completionCount: cap.completion_count,
        isCapReached: cap.total_coins_earned >= cap.max_coins_allowed && 
                     cap.total_xp_earned >= cap.max_xp_allowed
      })) || [];

      return {
        totalCoinsFromRewards: totalCoins,
        totalXPFromRewards: totalXP,
        rewardTypes,
        lessonProgress,
        totalLessonsWithCaps: capStats.data?.length || 0,
        totalCompletedCaps: lessonProgress.filter(l => l.isCapReached).length
      };
    } catch (error) {
      logger.error('Error getting reward stats', error);
      return null;
    }
  }, [user]);

  // الحصول على معلومات الحد الأقصى للدرس المحدد
  const getLessonCapInfo = useCallback(async (lessonId: string) => {
    const cap = await getLessonRewardCap(lessonId);
    if (!cap) return null;

    return {
      coinsEarned: cap.total_coins_earned,
      xpEarned: cap.total_xp_earned,
      maxCoins: cap.max_coins_allowed,
      maxXP: cap.max_xp_allowed,
      coinsRemaining: cap.max_coins_allowed - cap.total_coins_earned,
      xpRemaining: cap.max_xp_allowed - cap.total_xp_earned,
      completionCount: cap.completion_count,
      coinsProgress: (cap.total_coins_earned / cap.max_coins_allowed) * 100,
      xpProgress: (cap.total_xp_earned / cap.max_xp_allowed) * 100,
      isCapReached: cap.total_coins_earned >= cap.max_coins_allowed && 
                   cap.total_xp_earned >= cap.max_xp_allowed
    };
  }, [getLessonRewardCap]);

  return {
    processSmartReward,
    calculateSmartReward,
    getRewardStats,
    getLessonCapInfo,
    loading
  };
};