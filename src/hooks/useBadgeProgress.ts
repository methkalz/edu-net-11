import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/types/badge';
import { getBadgeByPoints } from '@/utils/badgeSystem';

interface BadgeProgressState {
  currentBadge: Badge | null;
  showCelebration: boolean;
  celebrationBadge: Badge | null;
}

export const useBadgeProgress = (currentPoints: number | null | undefined) => {
  const [state, setState] = useState<BadgeProgressState>({
    currentBadge: null,
    showCelebration: false,
    celebrationBadge: null
  });
  
  const previousPointsRef = useRef<number | null>(null);

  // تحديث الوسام الحالي والتحقق من الإنجاز الجديد
  useEffect(() => {
    if (currentPoints === null || currentPoints === undefined) return;

    const newBadge = getBadgeByPoints(currentPoints);
    
    // التحقق من وجود نقاط سابقة مخزنة
    if (previousPointsRef.current !== null && previousPointsRef.current !== currentPoints) {
      const previousBadge = getBadgeByPoints(previousPointsRef.current);
      
      // التحقق من الحصول على وسام جديد
      if (newBadge && (!previousBadge || previousBadge.id !== newBadge.id)) {
        // تحقق خاص: هل عبر عتبة الـ 200 نقطة؟
        if (previousPointsRef.current < 200 && currentPoints >= 200) {
          setState({
            currentBadge: newBadge,
            showCelebration: true,
            celebrationBadge: newBadge
          });
          previousPointsRef.current = currentPoints;
          return;
        }
        
        // أي وسام جديد آخر
        setState({
          currentBadge: newBadge,
          showCelebration: true,
          celebrationBadge: newBadge
        });
        previousPointsRef.current = currentPoints;
        return;
      }
    }
    
    // تحديث عادي بدون احتفال
    setState(prev => ({
      ...prev,
      currentBadge: newBadge
    }));
    previousPointsRef.current = currentPoints;
  }, [currentPoints]);

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
      showCelebration: false,
      celebrationBadge: null
    });
    previousPointsRef.current = null;
  }, []);

  return {
    currentBadge: state.currentBadge,
    showCelebration: state.showCelebration,
    celebrationBadge: state.celebrationBadge,
    closeCelebration,
    resetTracking
  };
};
