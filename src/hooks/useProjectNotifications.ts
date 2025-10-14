import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import { toast } from '@/hooks/use-toast';

export interface ProjectNotification {
  id: string;
  teacher_id: string;
  project_id: string;
  comment_id?: string;
  notification_type: string;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  project_title?: string;
  student_name?: string;
  grade_level?: string | null; // ✅ إضافة حقل الصف
}

export const useProjectNotifications = () => {
  const { userProfile } = useAuth();
  const { allowedGrades, loading: accessLoading } = useTeacherContentAccess();
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب الإشعارات مع فلترة حسب الصفوف المسؤول عنها
  const fetchNotifications = async () => {
    console.log('🔔 fetchNotifications called', { 
      userId: userProfile?.user_id, 
      role: userProfile?.role, 
      accessLoading 
    });
    
    if (!userProfile?.user_id || userProfile.role !== 'teacher' || accessLoading) {
      console.log('🔔 fetchNotifications SKIPPED - conditions not met');
      return;
    }

    console.log('🔔 fetchNotifications PROCEEDING...');
    
    try {
      setLoading(true);
      setError(null);

      // التحقق من الصفوف المسموح بها
      if (allowedGrades.length === 0) {
        console.log('Teacher has no allowed grades - no notifications');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // ✅ جلب الإشعارات مباشرة - الـ RLS policies تتولى الفلترة تلقائياً
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('teacher_notifications')
        .select(`
          id,
          teacher_id,
          project_id,
          comment_id,
          notification_type,
          title,
          message,
          is_read,
          created_at,
          updated_at
        `)
        .eq('teacher_id', userProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;
      
      console.log('🔔 Raw notifications from DB:', notificationsData?.length || 0);

      // ✅ جلب معلومات المشاريع والطلاب بشكل فعّال
      const projectIds = [...new Set((notificationsData || []).map(n => n.project_id))];
      console.log('🔔 Project IDs to fetch:', projectIds);
      
      // جلب مشاريع الصف 12
      const { data: grade12Projects } = await supabase
        .from('grade12_final_projects')
        .select('id, title, student_id')
        .in('id', projectIds);
      console.log('🔔 Grade 12 projects:', grade12Projects?.length || 0, grade12Projects);

      // جلب مشاريع الصف 10
      const { data: grade10Projects } = await supabase
        .from('grade10_mini_projects')
        .select('id, title, student_id')
        .in('id', projectIds);
      console.log('🔔 Grade 10 projects:', grade10Projects?.length || 0, grade10Projects);

      // دمج المشاريع
      const allProjects = [...(grade12Projects || []), ...(grade10Projects || [])];
      const projectsMap = new Map(allProjects.map(p => [p.id, p]));
      console.log('🔔 Total projects found:', allProjects.length);

      // جلب معلومات الطلاب - student_id هو في الحقيقة user_id
      const studentUserIds = [...new Set(allProjects.map(p => p.student_id))];
      console.log('🔔 Student user IDs to fetch:', studentUserIds);
      
      const { data: students } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentUserIds);
      console.log('🔔 Students found:', students?.length || 0, students);

      const studentsMap = new Map((students || []).map(s => [s.user_id, s]));
      console.log('🔔 Students map:', studentsMap);

      // تحديد نوع المشروع (grade10 أو grade12) بناءً على الجدول
      const grade12ProjectIds = new Set((grade12Projects || []).map(p => p.id));
      const grade10ProjectIds = new Set((grade10Projects || []).map(p => p.id));
      console.log('🔔 Grade 12 project IDs:', Array.from(grade12ProjectIds));
      console.log('🔔 Grade 10 project IDs:', Array.from(grade10ProjectIds));

      // تحويل البيانات
      console.log('🔔 Starting to format notifications...');
      const formattedNotifications = (notificationsData || []).map(notification => {
        const project = projectsMap.get(notification.project_id);
        // student_id في المشاريع هو في الواقع user_id
        const student = project ? studentsMap.get(project.student_id) : null;
        
        // تحديد الصف بناءً على أي جدول يحتوي على المشروع
        const grade_level = grade12ProjectIds.has(notification.project_id) ? '12' : 
                           grade10ProjectIds.has(notification.project_id) ? '10' : null;

        return {
          id: notification.id,
          teacher_id: notification.teacher_id,
          project_id: notification.project_id,
          comment_id: notification.comment_id,
          notification_type: notification.notification_type,
          title: notification.title,
          message: notification.message,
          is_read: notification.is_read,
          created_at: notification.created_at,
          updated_at: notification.updated_at,
          project_title: project?.title || 'مشروع غير محدد',
          student_name: student?.full_name || 'طالب غير محدد',
          grade_level: grade_level
        };
      });

      console.log('🔔 Formatted notifications RESULT:', formattedNotifications.length);
      console.log('🔔 Formatted notifications DETAILS:', JSON.stringify(formattedNotifications.map(n => ({
        id: n.id.substring(0,8),
        grade_level: n.grade_level,
        project_title: n.project_title,
        student_name: n.student_name
      })), null, 2));
      
      console.log('🔔 About to call setNotifications with', formattedNotifications.length, 'notifications');
      setNotifications(formattedNotifications);
      console.log('🔔 setNotifications called!');
      
      // حساب عدد الإشعارات غير المقروءة
      const unreadNotifications = formattedNotifications.filter(n => !n.is_read);
      setUnreadCount(unreadNotifications.length);
      console.log('🔔 setUnreadCount called with', unreadNotifications.length);

    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
      toast({
        title: 'خطأ في جلب الإشعارات',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تحديد الإشعار كمقروء
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // تحديث عدد الإشعارات غير المقروءة
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'خطأ في تحديث الإشعار',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    if (!userProfile?.user_id) return;

    try {
      const { error } = await supabase
        .from('teacher_notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('teacher_id', userProfile.user_id)
        .eq('is_read', false);

      if (error) throw error;

      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);

      toast({
        title: 'تم تحديث الإشعارات',
        description: 'تم تحديد جميع الإشعارات كمقروءة'
      });

    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'خطأ في تحديث الإشعارات',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // حذف إشعار
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // تحديث الحالة المحلية
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: 'تم حذف الإشعار',
        description: 'تم حذف الإشعار بنجاح'
      });

    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'خطأ في حذف الإشعار',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // تنظيف الإشعارات القديمة (أكثر من شهر)
  const cleanupOldNotifications = async () => {
    if (!userProfile?.user_id) return;

    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { error } = await supabase
        .from('teacher_notifications')
        .delete()
        .eq('teacher_id', userProfile.user_id)
        .lt('created_at', oneMonthAgo.toISOString());

      if (error) throw error;

      await fetchNotifications();

    } catch (error: any) {
      console.error('Error cleaning up old notifications:', error);
    }
  };

  // الحصول على إشعارات اليوم
  const getTodayNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return notifications.filter(notification => {
      const notificationDate = new Date(notification.created_at);
      notificationDate.setHours(0, 0, 0, 0);
      return notificationDate.getTime() === today.getTime();
    });
  };

  // الحصول على إحصائيات الإشعارات
  const getNotificationStats = () => {
    const total = notifications.length;
    const unread = unreadCount;
    const today = getTodayNotifications().length;
    const newComments = notifications.filter(n => n.notification_type === 'new_comment').length;

    return {
      total,
      unread,
      today,
      newComments
    };
  };

  useEffect(() => {
    if (userProfile?.user_id && userProfile?.role === 'teacher' && !accessLoading) {
      fetchNotifications();
    }
  }, [userProfile?.user_id, userProfile?.role, accessLoading]); // تجنب allowedGrades في dependency array

  // إعداد real-time subscription للإشعارات الجديدة
  useEffect(() => {
    if (!userProfile?.user_id || userProfile.role !== 'teacher') return;

    const channel = supabase
      .channel('teacher-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'teacher_notifications',
          filter: `teacher_id=eq.${userProfile.user_id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          fetchNotifications();
          
          // إشعار صوتي أو بصري
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('إشعار جديد من مشروع طالب', {
              body: 'لديك تعليق جديد على أحد المشاريع',
              icon: '/logo.png'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.user_id, userProfile?.role]);

  // طلب إذن الإشعارات عند التحميل
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    stats: getNotificationStats(),
    todayNotifications: getTodayNotifications(),
    fetchNotifications,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    cleanupOldNotifications,
    refetch: fetchNotifications
  };
};