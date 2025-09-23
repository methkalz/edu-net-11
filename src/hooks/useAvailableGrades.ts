import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

// Fetch function
const fetchAvailableGrades = async (userProfile: any): Promise<string[]> => {
  // السوبر آدمن يحصل على جميع الصفوف
  if (userProfile?.role === 'superadmin') {
    logger.info('Superadmin has access to all grades');
    return ['10', '11', '12'];
  }

  // المستخدمون الآخرون يحتاجون إلى school_id
  if (!userProfile?.school_id) {
    return ['10', '11', '12']; // Default fallback
  }

  const { data, error: fetchError } = await supabase
    .rpc('get_available_grade_levels', { school_uuid: userProfile.school_id });

  if (fetchError) {
    logger.error('Error fetching available grades', fetchError);
    throw fetchError;
  }

  const grades = data || ['10', '11', '12'];
  logger.info('Available grades loaded', { grades });
  return grades;
};

export const useAvailableGrades = () => {
  const { userProfile } = useAuth();

  const {
    data: availableGrades = ['10', '11', '12'],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.SCHOOL.AVAILABLE_GRADES(userProfile?.school_id || '', userProfile?.role || ''),
    queryFn: () => fetchAvailableGrades(userProfile),
    enabled: Boolean(userProfile),
    staleTime: CACHE_TIMES.LONG, // Cache for 1 hour - grades don't change often
    gcTime: CACHE_TIMES.VERY_LONG, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  const isGradeAvailable = (grade: string): boolean => {
    return availableGrades.includes(grade);
  };

  return {
    availableGrades,
    isGradeAvailable,
    loading,
    error: error?.message || null,
    refetch
  };
};