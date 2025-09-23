import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

interface SchoolPackage {
  id: string;
  name: string;
  name_ar: string;
  description_ar: string;
  available_grade_contents: string[];
  max_students: number;
  max_teachers: number;
  price: number;
  currency: string;
  duration_days: number | null;
  features: string[];
  start_date: string;
  end_date: string;
  status: string;
  current_students: number;
  current_teachers: number;
}

// Fetch function
const fetchSchoolPackage = async (schoolId: string): Promise<SchoolPackage | null> => {
  const { data, error: fetchError } = await supabase
    .rpc('get_school_package_with_usage', { school_uuid: schoolId });

  if (fetchError) {
    logger.error('Error fetching school package', fetchError);
    throw fetchError;
  }

  const packageData = data as unknown as SchoolPackage;
  logger.info('School package loaded', { packageData });
  return packageData;
};

export const useSchoolPackage = () => {
  const { userProfile } = useAuth();

  const {
    data: schoolPackage = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.SCHOOL.PACKAGE(userProfile?.school_id || ''),
    queryFn: () => fetchSchoolPackage(userProfile!.school_id),
    enabled: Boolean(userProfile?.school_id),
    staleTime: CACHE_TIMES.MEDIUM, // Cache for 15 minutes
    gcTime: CACHE_TIMES.LONG, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  return {
    schoolPackage,
    loading,
    error: error?.message || null,
    refetch
  };
};