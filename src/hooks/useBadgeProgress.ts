import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/types/badge';
import { getBadgeByPoints } from '@/utils/badgeSystem';

interface BadgeProgressState {
  currentBadge: Badge | null;
  showCelebration: boolean;
  celebrationBadge: Badge | null;
}

// مفتاح localStorage للأوسمة المحتفل بها
const CELEBRATED_BADGES_KEY = 'celebrated_badges';

// دالة مساعدة لجلب الأوسمة المحتفل بها من localStorage
const getCelebratedBadges = (): string[] => {
  try {
    const stored = localStorage.getItem(CELEBRATED_BADGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading celebrated badges:', error);
    return [];
  }
};

// دالة مساعدة لحفظ وسام محتفل به في localStorage
const saveCelebratedBadge = (badgeId: string): void => {
  try {
    const current = getCelebratedBadges();
    if (!current.includes(badgeId)) {
      localStorage.setItem(CELEBRATED_BADGES_KEY, JSON.stringify([...current, badgeId]));
    }
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

  // تحديث الوسام الحالي والتحقق من الإنجاز الجديد
  useEffect(() => {
    if (currentPoints === null || currentPoints === undefined) {
      console.log('🎖️ [BadgeProgress] No points available');
      return;
    }

    console.log('🎖️ [BadgeProgress] Points updated:', currentPoints);
    
    const newBadge = getBadgeByPoints(currentPoints);
    const celebratedBadges = getCelebratedBadges();
    
    console.log('🎖️ [BadgeProgress] Current badge:', newBadge?.name, 'Points:', currentPoints);
    console.log('🎖️ [BadgeProgress] Already celebrated:', celebratedBadges);
    
    // تحديث الوسام الحالي
    setState(prev => {
      const prevBadgeId = prev.currentBadge?.id;
      const hasNewBadge = newBadge && prevBadgeId !== newBadge.id;
      
      console.log('🎖️ [BadgeProgress] Badge changed:', { 
        from: prevBadgeId, 
        to: newBadge?.id,
        hasNewBadge
      });
      
      return {
        ...prev,
        currentBadge: newBadge
      };
    });

    // التحقق من وجود وسام جديد لم يتم الاحتفال به
    // إضافة تأخير صغير للتأكد من تحديث البيانات
    if (newBadge && !celebratedBadges.includes(newBadge.id)) {
      console.log('🎉 [BadgeProgress] NEW BADGE EARNED!', newBadge.name);
      
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          showCelebration: true,
          celebrationBadge: newBadge
        }));

        // تسجيل الاحتفال في localStorage
        saveCelebratedBadge(newBadge.id);
        console.log('🎉 [BadgeProgress] Celebration shown and saved');
      }, 500);
    }
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
    try {
      localStorage.removeItem(CELEBRATED_BADGES_KEY);
    } catch (error) {
      console.error('Error clearing celebrated badges:', error);
    }
  }, []);

  return {
    currentBadge: state.currentBadge,
    showCelebration: state.showCelebration,
    celebrationBadge: state.celebrationBadge,
    closeCelebration,
    resetTracking
  };
};
