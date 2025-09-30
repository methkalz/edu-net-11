import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CACHE_TIMES } from '@/lib/query-keys';

export interface StudentTrackingData {
  student_id: string;
  student_name: string;
  student_email: string;
  total_time_minutes: number;
  videos_watched: number;
  documents_read: number;
  lessons_completed: number;
  projects_completed: number;
  games_played: number;
  total_points: number;
  last_activity: string | null;
}

export const useTeacherStudentTracking = () => {
  const { user, userProfile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-student-tracking', user?.id, userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_teacher_student_tracking', {
        teacher_user_id: user!.id,
        teacher_school_id: userProfile!.school_id,
      });

      if (error) throw error;
      return (data || []) as StudentTrackingData[];
    },
    enabled: !!user?.id && !!userProfile?.school_id && userProfile?.role === 'teacher',
    staleTime: CACHE_TIMES.SHORT,
  });

  return {
    students: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};
