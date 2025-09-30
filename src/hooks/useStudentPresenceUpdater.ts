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
    if (!user || userProfile?.role !== 'student') {
      console.log('⏭️ Skipping presence update:', { hasUser: !!user, role: userProfile?.role });
      return;
    }

    try {
      // الحصول على معرف الطالب
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        console.error('❌ Error fetching student:', studentError);
        return;
      }

      if (!studentData) {
        console.warn('⚠️ No student found for user:', user.id);
        return;
      }

      console.log('✅ Updating presence:', { 
        studentId: studentData.id, 
        isOnline, 
        currentPage: currentPage || window.location.pathname 
      });

      // استدعاء دالة تحديث الحضور
      const { error: rpcError } = await supabase.rpc('update_student_presence', {
        p_student_id: studentData.id,
        p_is_online: isOnline,
        p_current_page: currentPage || window.location.pathname
      });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
      } else {
        console.log('✅ Presence updated successfully');
      }

    } catch (error) {
      console.error('❌ Error updating student presence:', error);
    }
  };

  // heartbeat للطلاب النشطين
  const sendHeartbeat = async () => {
    if (isOnlineRef.current) {
      await updatePresence(true);
    }
  };

  // متابعة نشاط المستخدم
  useEffect(() => {
    if (!user || userProfile?.role !== 'student') return;

    // تحديث أولي
    updatePresence(true);

    // تحديث دوري كل 15 ثانية
    intervalRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        updatePresence(true);
      }
    }, 15 * 1000); // 15 ثانية

    // heartbeat إضافي كل 10 ثواني للنشاط
    const heartbeatInterval = setInterval(sendHeartbeat, 10 * 1000);

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
      console.log('🧹 Cleaning up presence tracker...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(heartbeatInterval);

      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });

      window.removeEventListener('blur', handleInactivity);
      document.removeEventListener('visibilitychange', handleInactivity);
      window.removeEventListener('popstate', handlePageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // تحديث أخير عند إلغاء التركيب
      console.log('👋 Final presence update: setting offline');
      updatePresence(false);
    };
  }, [user, userProfile?.role]);

  return { updatePresence };
};