import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook لتحديث حالة حضور المعلمين ومدراء المدارس تلقائياً
 */
export const useTeacherPresenceUpdater = () => {
  const { user, userProfile } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef(true);

  // تحديث حالة الحضور
  const updatePresence = async (isOnline: boolean = true, currentPage?: string) => {
    if (!user || !userProfile?.role || !['teacher', 'school_admin'].includes(userProfile.role)) {
      console.log('⏭️ Skipping teacher presence update:', { 
        hasUser: !!user, 
        role: userProfile?.role 
      });
      return;
    }

    try {
      console.log('✅ Updating teacher presence:', { 
        userId: user.id, 
        role: userProfile.role,
        isOnline, 
        currentPage: currentPage || window.location.pathname 
      });

      // استدعاء دالة تحديث الحضور
      const { error: rpcError } = await supabase.rpc('update_teacher_presence', {
        p_user_id: user.id,
        p_is_online: isOnline,
        p_current_page: currentPage || window.location.pathname
      });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
      } else {
        console.log('✅ Teacher presence updated successfully');
      }

    } catch (error) {
      console.error('❌ Error updating teacher presence:', error);
    }
  };

  // heartbeat للمعلمين النشطين
  const sendHeartbeat = async () => {
    if (isOnlineRef.current) {
      await updatePresence(true);
    }
  };

  // متابعة نشاط المستخدم
  useEffect(() => {
    if (!user || !userProfile?.role || !['teacher', 'school_admin'].includes(userProfile.role)) {
      return;
    }

    // تحديث أولي
    updatePresence(true);

    // تحديث دوري كل 30 ثانية
    intervalRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        updatePresence(true);
      }
    }, 30 * 1000); // 30 ثانية

    // heartbeat إضافي كل 15 ثانية للنشاط
    const heartbeatInterval = setInterval(sendHeartbeat, 15 * 1000);

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
      console.log('🧹 Cleaning up teacher presence tracker...');
      
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
      console.log('👋 Final teacher presence update: setting offline');
      updatePresence(false);
    };
  }, [user, userProfile?.role]);

  return { updatePresence };
};
