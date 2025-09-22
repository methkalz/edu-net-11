import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface StudentNotification {
  id: string;
  student_id: string;
  project_id: string | null;
  comment_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useStudentNotifications = () => {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('student_notifications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('student_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('خطأ في تحديث الإشعار:', error);
        return;
      }

      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('student_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('student_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('خطأ في تحديث الإشعارات:', error);
        return;
      }

      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      toast({
        title: "تم تحديث الإشعارات",
        description: "تم تحديد جميع الإشعارات كمقروءة",
      });
    } catch (error) {
      console.error('خطأ في تحديث الإشعارات:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // الاستماع للإشعارات الجديدة في الوقت الفعلي
    const channel = supabase
      .channel('student-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_notifications',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as StudentNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // إظهار إشعار toast للمستخدم
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_notifications',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as StudentNotification;
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};