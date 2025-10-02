import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/types/badge';
import { getBadgeByPoints } from '@/utils/badgeSystem';
import { supabase } from '@/integrations/supabase/client';

interface BadgeProgressState {
  currentBadge: Badge | null;
  showCelebration: boolean;
  celebrationBadge: Badge | null;
}

// دالة للتحقق من الاحتفال بالوسام من قاعدة البيانات
const checkCelebratedBadge = async (userId: string, badgeId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .rpc('has_celebrated_badge', {
        p_student_id: userId,
        p_badge_id: badgeId
      });
    return data === true;
  } catch (error) {
    console.error('Error checking celebrated badge:', error);
    return false;
  }
};

// دالة لحفظ الاحتفال بالوسام في قاعدة البيانات
const saveCelebratedBadge = async (userId: string, badgeId: string): Promise<void> => {
  try {
    await supabase.rpc('record_badge_celebration', {
      p_student_id: userId,
      p_badge_id: badgeId
    });
  } catch (error) {
    console.error('Error saving celebrated badge:', error);
  }
};

export const useBadgeProgress = (currentPoints: number | null | undefined) => {
  const [state, setState] = useState<BadgeProgressState>({
    currentBadge: null,
    showCelebration: false,
    celebrationBadge: null
  });
  const [userId, setUserId] = useState<string | null>(null);

  // جلب معرف المستخدم
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // تحديث الوسام الحالي والتحقق من الإنجاز الجديد
  useEffect(() => {
    if (!userId || currentPoints === null || currentPoints === undefined) {
      console.log('🎖️ [Badge System] Waiting for user or points');
      return;
    }

    const checkAndUpdateBadge = async () => {
      console.log('🎖️ [Badge System] Current points:', currentPoints);
      
      const newBadge = getBadgeByPoints(currentPoints);
      console.log('🎖️ [Badge System] Calculated badge:', newBadge?.name || 'None');
      
      // تحديث الوسام الحالي
      setState(prev => ({
        ...prev,
        currentBadge: newBadge
      }));

      // التحقق من وجود وسام جديد لم يتم الاحتفال به
      if (newBadge) {
        const hasCelebrated = await checkCelebratedBadge(userId, newBadge.id);
        console.log('🎖️ [Badge System] Has celebrated:', hasCelebrated);
        
        if (!hasCelebrated) {
          console.log('🎉 [Badge System] NEW BADGE! Showing celebration for:', newBadge.name);
          setState(prev => ({
            ...prev,
            showCelebration: true,
            celebrationBadge: newBadge
          }));

          // تسجيل الاحتفال في قاعدة البيانات
          await saveCelebratedBadge(userId, newBadge.id);
        } else {
          console.log('✅ [Badge System] Badge already celebrated:', newBadge.name);
        }
      } else {
        console.log('⚠️ [Badge System] No badge for current points');
      }
    };

    checkAndUpdateBadge();
  }, [currentPoints, userId]);

  // إغلاق الاحتفال
  const closeCelebration = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCelebration: false,
      celebrationBadge: null
    }));
  }, []);

  return {
    currentBadge: state.currentBadge,
    showCelebration: state.showCelebration,
    celebrationBadge: state.celebrationBadge,
    closeCelebration
  };
};
