import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook لتحديث حالة حضور الطالب تلقائيا
 */
export const useStudentPresenceUpdater = () => {
  const { user, userProfile } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef(true);

  // تحديث حالة الحضور
  const updatePresence = async (isOnline: boolean = true, currentPage?: string) => {
    if (!user || userProfile?.role !== 'student') return;

    try {
      // الحصول على معرف الطالب
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData) return;

      // استدعاء دالة تحديث الحضور
      await supabase.rpc('update_student_presence', {
        p_student_id: studentData.id,
        p_is_online: isOnline,
        p_current_page: currentPage || window.location.pathname
      });

    } catch (error) {
      console.error('Error updating student presence:', error);
    }
  };

  // متابعة نشاط المستخدم
  useEffect(() => {
    if (!user || userProfile?.role !== 'student') return;

    // تحديث أولي
    updatePresence(true);

    // تحديث دوري كل دقيقتين
    intervalRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        updatePresence(true);
      }
    }, 2 * 60 * 1000); // دقيقتان

    // استماع لأحداث النشاط
    const handleActivity = () => {
      if (!isOnlineRef.current) {
        isOnlineRef.current = true;
        updatePresence(true);
      }
    };

    const handleInactivity = () => {
      isOnlineRef.current = false;
      updatePresence(false);
    };

    // أحداث النشاط
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // أحداث عدم النشاط
    window.addEventListener('blur', handleInactivity);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleInactivity();
      } else {
        handleActivity();
      }
    });

    // تتبع تغيير الصفحة
    const handlePageChange = () => {
      updatePresence(true, window.location.pathname);
    };

    window.addEventListener('popstate', handlePageChange);

    // تنظيف عند الخروج
    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });

      window.removeEventListener('blur', handleInactivity);
      document.removeEventListener('visibilitychange', handleInactivity);
      window.removeEventListener('popstate', handlePageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // تحديث أخير عند إلغاء التركيب
      updatePresence(false);
    };
  }, [user, userProfile?.role]);

  return { updatePresence };
};