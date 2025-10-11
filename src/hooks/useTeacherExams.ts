import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';

export interface ExamStats {
  id: string;
  title: string;
  grade_levels: string[];
  status: string;
  total_questions: number;
  total_points: number;
  start_datetime: string;
  end_datetime: string;
  attempts_count: number;
  avg_score: number | null;
  avg_percentage: number | null;
}

export const useTeacherExams = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-exams', teacherId],
    queryFn: async () => {
      if (!teacherId) {
        logger.warn('لا يوجد معرف معلم');
        return { exams: [], totalQuestions: 0, stats: null };
      }

      logger.debug(`جلب امتحانات المعلم ${teacherId}`);
      
      // جلب الامتحانات التي أنشأها المعلم
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('created_by', teacherId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (examsError) {
        logger.error('خطأ في جلب الامتحانات', examsError);
        throw examsError;
      }

      // جلب عدد الأسئلة في بنك الأسئلة
      const { count: questionsCount, error: questionsError } = await supabase
        .from('question_bank')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', teacherId);

      if (questionsError) {
        logger.error('خطأ في جلب عدد الأسئلة', questionsError);
      }

      // جلب إحصائيات المحاولات لكل امتحان
      const examsWithStats: ExamStats[] = await Promise.all(
        (exams || []).map(async (exam) => {
          const { data: attempts, error: attemptsError } = await supabase
            .from('exam_attempts')
            .select('score, percentage')
            .eq('exam_id', exam.id)
            .eq('status', 'submitted');

          if (attemptsError) {
            logger.error(`خطأ في جلب محاولات الامتحان ${exam.id}`, attemptsError);
          }

          const attemptsCount = attempts?.length || 0;
          const avgScore = attemptsCount > 0
            ? attempts!.reduce((sum, a) => sum + (a.score || 0), 0) / attemptsCount
            : null;
          const avgPercentage = attemptsCount > 0
            ? attempts!.reduce((sum, a) => sum + (a.percentage || 0), 0) / attemptsCount
            : null;

          return {
            id: exam.id,
            title: exam.title,
            grade_levels: exam.grade_levels,
            status: exam.status,
            total_questions: exam.total_questions,
            total_points: exam.total_points,
            start_datetime: exam.start_datetime,
            end_datetime: exam.end_datetime,
            attempts_count: attemptsCount,
            avg_score: avgScore,
            avg_percentage: avgPercentage,
          };
        })
      );

      // حساب الإحصائيات الإجمالية
      const totalAttempts = examsWithStats.reduce((sum, e) => sum + e.attempts_count, 0);
      const activeExams = examsWithStats.filter(e => e.status === 'active').length;
      const avgScoreAll = examsWithStats.length > 0
        ? examsWithStats
            .filter(e => e.avg_percentage !== null)
            .reduce((sum, e) => sum + (e.avg_percentage || 0), 0) / 
          examsWithStats.filter(e => e.avg_percentage !== null).length
        : null;

      return {
        exams: examsWithStats,
        totalQuestions: questionsCount || 0,
        stats: {
          activeExams,
          totalAttempts,
          avgScoreAll,
        },
      };
    },
    enabled: !!teacherId,
  });
};
