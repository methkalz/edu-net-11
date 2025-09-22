import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export const useStudentAssignedGrade = () => {
  const { user, userProfile } = useAuth();
  const [assignedGrade, setAssignedGrade] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedGrade = async () => {
    if (!user || userProfile?.role !== 'student') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: gradeError } = await supabase
        .rpc('get_student_assigned_grade', { student_user_id: user.id });

      if (gradeError) throw gradeError;

      setAssignedGrade(data || '11');
      
      logger.info('Student assigned grade fetched', { 
        studentId: user.id,
        grade: data
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل الصف المخصص';
      setError(errorMessage);
      logger.error('Error fetching student assigned grade', err as Error);
      // Default to grade 11 on error
      setAssignedGrade('11');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedGrade();
  }, [user, userProfile]);

  return {
    assignedGrade,
    loading,
    error,
    refetch: fetchAssignedGrade
  };
};