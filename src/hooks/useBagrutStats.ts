import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BagrutStats {
  totalExams: number;
  publishedExams: number;
  totalAttempts: number;
  uniqueStudents: number;
  submittedAttempts: number;
  gradedAttempts: number;
  participatingSchools: number;
  averageScore: number;
}

export function useBagrutStats() {
  return useQuery({
    queryKey: ['bagrut-stats'],
    queryFn: async (): Promise<BagrutStats> => {
      // Fetch exam counts
      const { count: totalExams } = await supabase
        .from('bagrut_exams')
        .select('*', { count: 'exact', head: true });

      const { count: publishedExams } = await supabase
        .from('bagrut_exams')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      // Fetch all attempts with their data
      const { data: attempts } = await supabase
        .from('bagrut_attempts')
        .select('id, student_id, status, score, percentage, school_id');

      // Calculate unique students
      const uniqueStudentIds = new Set(attempts?.map(a => a.student_id) || []);
      
      // Calculate unique schools from attempts
      const uniqueSchoolIds = new Set(
        attempts?.filter(a => a.school_id).map(a => a.school_id) || []
      );

      // Count by status
      const submittedAttempts = attempts?.filter(a => a.status === 'submitted').length || 0;
      const gradedAttempts = attempts?.filter(a => a.status === 'graded').length || 0;

      // Calculate average score from graded attempts
      const gradedWithScores = attempts?.filter(a => a.status === 'graded' && a.percentage !== null) || [];
      const averageScore = gradedWithScores.length > 0
        ? Math.round(gradedWithScores.reduce((sum, a) => sum + (a.percentage || 0), 0) / gradedWithScores.length)
        : 0;

      return {
        totalExams: totalExams || 0,
        publishedExams: publishedExams || 0,
        totalAttempts: attempts?.length || 0,
        uniqueStudents: uniqueStudentIds.size,
        submittedAttempts,
        gradedAttempts,
        participatingSchools: uniqueSchoolIds.size,
        averageScore,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
