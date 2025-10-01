import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/types/badge';
import { getBadgeByPoints } from '@/utils/badgeSystem';

interface BadgeProgressState {
  currentBadge: Badge | null;
  previousPoints: number | null;
  showCelebration: boolean;
  celebrationBadge: Badge | null;
}

export const useBadgeProgress = (currentPoints: number | null | undefined) => {
  const [state, setState] = useState<BadgeProgressState>({
    currentBadge: null,
    previousPoints: null,
    showCelebration: false,
    celebrationBadge: null
  });

  // تحديث الوسام الحالي والتحقق من الإنجاز الجديد
  useEffect(() => {
    if (currentPoints === null || currentPoints === undefined) return;

    const newBadge = getBadgeByPoints(currentPoints);
    
    // التحقق من وجود نقاط سابقة مخزنة
    if (state.previousPoints !== null && state.previousPoints !== currentPoints) {
      const previousBadge = getBadgeByPoints(state.previousPoints);
      
      // التحقق من الحصول على وسام جديد
      if (newBadge && (!previousBadge || previousBadge.id !== newBadge.id)) {
        // تحقق خاص: هل عبر عتبة الـ 200 نقطة؟
        if (state.previousPoints < 200 && currentPoints >= 200) {
          setState(prev => ({
            ...prev,
            currentBadge: newBadge,
            previousPoints: currentPoints,
            showCelebration: true,
            celebrationBadge: newBadge
          }));
          return;
        }
        
        // أي وسام جديد آخر
        setState(prev => ({
          ...prev,
          currentBadge: newBadge,
          previousPoints: currentPoints,
          showCelebration: true,
          celebrationBadge: newBadge
        }));
        return;
      }
    }
    
    // تحديث عادي بدون احتفال
    setState(prev => ({
      ...prev,
      currentBadge: newBadge,
      previousPoints: currentPoints
    }));
  }, [currentPoints, state.previousPoints]);

  // إغلاق الاحتفال
  const closeCelebration = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCelebration: false,
      celebrationBadge: null
    }));
  }, []);

  // إعادة تعيين التتبع (مفيد عند تسجيل الخروج مثلاً)
  const resetTracking = useCallback(() => {
    setState({
      currentBadge: null,
      previousPoints: null,
      showCelebration: false,
      celebrationBadge: null
    });
  }, []);

  return {
    currentBadge: state.currentBadge,
    showCelebration: state.showCelebration,
    celebrationBadge: state.celebrationBadge,
    closeCelebration,
    resetTracking
  };
};
