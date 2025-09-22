import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

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

export const useSchoolPackage = () => {
  const { userProfile } = useAuth();
  const [schoolPackage, setSchoolPackage] = useState<SchoolPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchoolPackage = async () => {
    if (!userProfile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_school_package_with_usage', { school_uuid: userProfile.school_id });

      if (fetchError) {
        throw fetchError;
      }

      setSchoolPackage(data as unknown as SchoolPackage);
      logger.info('School package loaded', { packageData: data });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل بيانات الباقة';
      setError(errorMessage);
      logger.error('Error fetching school package', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchSchoolPackage();
    }
  }, [userProfile?.school_id]);

  return {
    schoolPackage,
    loading,
    error,
    refetch: fetchSchoolPackage
  };
};