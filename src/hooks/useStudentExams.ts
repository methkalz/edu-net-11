// Hook لجلب الامتحانات المتاحة للطالب
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvailableExam } from '@/types/exam';
import { logger } from '@/lib/logging';

export const useStudentExams = (studentId?: string) => {
  return useQuery({
    queryKey: ['student-exams', studentId],
    queryFn: async () => {
      if (!studentId) {
        logger.warn('لا يوجد معرف طالب');
        return [];
      }

      logger.debug(`جلب الامتحانات المتاحة للطالب ${studentId}`);
      
      const { data, error } = await supabase
        .rpc('get_available_exams', { p_student_id: studentId });

      if (error) {
        logger.error('خطأ في جلب الامتحانات المتاحة', error);
        throw error;
      }

      return data as any as AvailableExam[];
    },
    enabled: !!studentId,
  });
};
