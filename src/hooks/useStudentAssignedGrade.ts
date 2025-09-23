import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

const fetchAssignedGrade = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .rpc('get_student_assigned_grade', { student_user_id: userId });

  if (error) {
    logger.error('Error fetching student assigned grade', error);
    throw error;
  }

  const grade = data || '11';
  
  logger.info('Student assigned grade fetched', { 
    studentId: userId,
    grade
  });

  return grade;
};

export const useStudentAssignedGrade = () => {
  const { user, userProfile } = useAuth();

  const {
    data: assignedGrade = '11',
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.ASSIGNED_GRADE(user?.id || ''),
    queryFn: () => fetchAssignedGrade(user!.id),
    enabled: Boolean(user && userProfile?.role === 'student'),
    staleTime: CACHE_TIMES.LONG, // Cache for 1 hour - grade doesn't change often
    gcTime: CACHE_TIMES.VERY_LONG, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  return {
    assignedGrade,
    loading,
    error: error?.message || null,
    refetch
  };
};