import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/types/badge';
import { getBadgeByPoints } from '@/utils/badgeSystem';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BadgeProgressState {
  currentBadge: Badge | null;
  showCelebration: boolean;
  celebrationBadge: Badge | null;
}

// Hook للتحقق من الاحتفالات السابقة
const useCelebratedBadges = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['celebrated-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('student_badge_celebrations')
        .select('badge_id')
        .eq('student_id', userId);

      if (error) {
        console.error('Error fetching celebrated badges:', error);
        return [];
      }

      return data?.map(item => item.badge_id) || [];
    },
    enabled: !!userId,
  });
};

export const useBadgeProgress = (currentPoints: number | null | undefined) => {
  const [state, setState] = useState<BadgeProgressState>({
    currentBadge: null,
    showCelebration: false,
    celebrationBadge: null
  });
  
  const previousPointsRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // الحصول على معرف المستخدم
  const [userId, setUserId] = useState<string | undefined>();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  // جلب الأوسمة المحتفل بها مسبقاً
  const { data: celebratedBadges = [] } = useCelebratedBadges(userId);

  // Mutation لتسجيل احتفال جديد
  const recordCelebrationMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!userId) return;
      
      const { error } = await supabase
        .from('student_badge_celebrations')
        .insert({
          student_id: userId,
          badge_id: badgeId
        });

      if (error && error.code !== '23505') { // تجاهل خطأ التكرار
        console.error('Error recording badge celebration:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // تحديث الكاش
      queryClient.invalidateQueries({ queryKey: ['celebrated-badges', userId] });
    }
  });

  // تحديث الوسام الحالي والتحقق من الإنجاز الجديد
  useEffect(() => {
    if (currentPoints === null || currentPoints === undefined || !userId) return;

    const newBadge = getBadgeByPoints(currentPoints);
    
    // التحقق من وجود نقاط سابقة مخزنة
    if (previousPointsRef.current !== null && previousPointsRef.current !== currentPoints) {
      const previousBadge = getBadgeByPoints(previousPointsRef.current);
      
      // التحقق من الحصول على وسام جديد
      if (newBadge && (!previousBadge || previousBadge.id !== newBadge.id)) {
        // التحقق من أن هذا الوسام لم يتم الاحتفال به من قبل
        if (!celebratedBadges.includes(newBadge.id)) {
          setState({
            currentBadge: newBadge,
            showCelebration: true,
            celebrationBadge: newBadge
          });
          
          // تسجيل الاحتفال في قاعدة البيانات
          recordCelebrationMutation.mutate(newBadge.id);
        } else {
          // تحديث الوسام بدون احتفال
          setState(prev => ({
            ...prev,
            currentBadge: newBadge
          }));
        }
        
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
  }, [currentPoints, userId, celebratedBadges, recordCelebrationMutation]);

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
