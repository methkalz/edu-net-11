import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

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

// Fetch function
const fetchStudentNotifications = async (userId: string): Promise<StudentNotification[]> => {
  const { data, error } = await supabase
    .from('student_notifications')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('Error fetching student notifications', error);
    throw error;
  }

  return data || [];
};

export const useStudentNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading: loading,
    error,
    refetch: fetchNotifications,
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.NOTIFICATIONS(user?.id || ''),
    queryFn: () => fetchStudentNotifications(user!.id),
    enabled: Boolean(user),
    staleTime: CACHE_TIMES.SHORT, // Cache for 5 minutes - notifications may change frequently
    gcTime: CACHE_TIMES.MEDIUM, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('student_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        logger.error('Error marking notification as read', error);
        throw error;
      }
    },
    onSuccess: (_, notificationId) => {
      // Update cache optimistically
      queryClient.setQueryData(
        QUERY_KEYS.STUDENT.NOTIFICATIONS(user?.id || ''),
        (oldData: StudentNotification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true } 
              : n
          );
        }
      );
    },
    onError: (error) => {
      logger.error('Failed to mark notification as read', error as Error);
    }
  });

  const markAsRead = (notificationId: string) => {
    return markAsReadMutation.mutateAsync(notificationId);
  };

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('student_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('student_id', user.id)
        .eq('is_read', false);

      if (error) {
        logger.error('Error marking all notifications as read', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Update cache optimistically
      queryClient.setQueryData(
        QUERY_KEYS.STUDENT.NOTIFICATIONS(user?.id || ''),
        (oldData: StudentNotification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(n => ({ ...n, is_read: true }));
        }
      );
      
      toast({
        title: "تم تحديث الإشعارات",
        description: "تم تحديد جميع الإشعارات كمقروءة",
      });
    },
    onError: (error) => {
      logger.error('Failed to mark all notifications as read', error as Error);
    }
  });

  const markAllAsRead = () => {
    return markAllAsReadMutation.mutateAsync();
  };

  // Real-time subscription effect
  React.useEffect(() => {
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
          
          // Update cache with new notification
          queryClient.setQueryData(
            QUERY_KEYS.STUDENT.NOTIFICATIONS(user.id),
            (oldData: StudentNotification[] | undefined) => {
              return [newNotification, ...(oldData || [])];
            }
          );
          
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
          
          // Update cache with updated notification
          queryClient.setQueryData(
            QUERY_KEYS.STUDENT.NOTIFICATIONS(user.id),
            (oldData: StudentNotification[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(n => 
                n.id === updatedNotification.id ? updatedNotification : n
              );
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};