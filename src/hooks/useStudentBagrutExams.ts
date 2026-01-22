// Hook لجلب امتحانات البجروت المتاحة للطالب
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';

export interface AvailableBagrutExam {
  id: string;
  title: string;
  exam_year: number;
  exam_season: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions: string | null;
  is_published: boolean;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  show_answers_to_students: boolean;
  allow_review_after_submit: boolean;
  // إحصائيات المحاولات
  attempts_used: number;
  attempts_remaining: number;
  can_start: boolean;
  last_attempt_status: string | null;
  best_score: number | null;
  best_percentage: number | null;
}

export const useStudentBagrutExams = (studentId?: string, gradeLevel?: string) => {
  const queryClient = useQueryClient();

  // Realtime subscriptions للتحديثات الفورية
  useEffect(() => {
    if (!studentId) return;

    logger.debug(`إعداد Realtime subscriptions لامتحانات البجروت للطالب ${studentId}`);

    // الاستماع لتغييرات جدول bagrut_exams
    const examsChannel = supabase
      .channel('student-bagrut-exams-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bagrut_exams'
      }, (payload) => {
        logger.debug('تحديث في جدول bagrut_exams:', payload);
        queryClient.invalidateQueries({ queryKey: ['student-bagrut-exams', studentId] });
      })
      .subscribe();

    // الاستماع لتغييرات محاولات الطالب
    const attemptsChannel = supabase
      .channel('student-bagrut-attempts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bagrut_attempts',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        logger.debug('تحديث في محاولات البجروت:', payload);
        queryClient.invalidateQueries({ queryKey: ['student-bagrut-exams', studentId] });
      })
      .subscribe();

    return () => {
      logger.debug('تنظيف Realtime subscriptions للبجروت');
      supabase.removeChannel(examsChannel);
      supabase.removeChannel(attemptsChannel);
    };
  }, [studentId, queryClient]);

  return useQuery({
    queryKey: ['student-bagrut-exams', studentId, gradeLevel],
    queryFn: async () => {
      if (!studentId) {
        logger.warn('لا يوجد معرف طالب');
        return [];
      }

      logger.debug(`جلب امتحانات البجروت المتاحة للطالب ${studentId} - الصف ${gradeLevel}`);

      // جلب الامتحانات المنشورة المتاحة لصف الطالب
      let query = supabase
        .from('bagrut_exams')
        .select('*')
        .eq('is_published', true)
        .order('exam_year', { ascending: false });

      // تصفية حسب الصف إذا كان متاحاً
      if (gradeLevel) {
        query = query.contains('available_for_grades', [gradeLevel]);
      }

      const { data: exams, error: examsError } = await query;

      if (examsError) {
        logger.error('خطأ في جلب امتحانات البجروت', examsError);
        throw examsError;
      }

      // جلب محاولات الطالب
      const { data: attempts, error: attemptsError } = await supabase
        .from('bagrut_attempts')
        .select('*')
        .eq('student_id', studentId);

      if (attemptsError) {
        logger.error('خطأ في جلب محاولات الطالب', attemptsError);
        throw attemptsError;
      }

      const now = new Date();

      // معالجة كل امتحان مع إحصائياته
      const examsWithStats: AvailableBagrutExam[] = (exams || []).map((exam) => {
        const examAttempts = (attempts || []).filter(a => a.exam_id === exam.id);
        const submittedAttempts = examAttempts.filter(a => a.status === 'submitted' || a.status === 'graded');
        const inProgressAttempt = examAttempts.find(a => a.status === 'in_progress');
        
        const attemptsUsed = submittedAttempts.length;
        const maxAttempts = exam.max_attempts || 1;
        const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);

        // التحقق من إمكانية البدء
        const isWithinTimeWindow = (
          (!exam.available_from || new Date(exam.available_from) <= now) &&
          (!exam.available_until || new Date(exam.available_until) >= now)
        );
        const canStart = isWithinTimeWindow && (attemptsRemaining > 0 || !!inProgressAttempt);

        // أفضل نتيجة
        const bestAttempt = submittedAttempts.reduce((best, current) => {
          if (!best) return current;
          return (current.percentage || 0) > (best.percentage || 0) ? current : best;
        }, null as any);

        // آخر حالة محاولة
        const lastAttempt = examAttempts.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )[0];

        return {
          id: exam.id,
          title: exam.title,
          exam_year: exam.exam_year,
          exam_season: exam.exam_season,
          subject: exam.subject,
          duration_minutes: exam.duration_minutes || 180,
          total_points: exam.total_points || 100,
          instructions: exam.instructions,
          is_published: exam.is_published,
          available_from: exam.available_from,
          available_until: exam.available_until,
          max_attempts: maxAttempts,
          show_answers_to_students: exam.show_answers_to_students || false,
          allow_review_after_submit: exam.allow_review_after_submit ?? true,
          attempts_used: attemptsUsed,
          attempts_remaining: attemptsRemaining,
          can_start: canStart,
          last_attempt_status: lastAttempt?.status || null,
          best_score: bestAttempt?.score || null,
          best_percentage: bestAttempt?.percentage || null,
        };
      });

      // تصفية الامتحانات حسب نافذة الوقت
      const now2 = new Date();
      const filteredExams = examsWithStats.filter(exam => {
        // إذا لم يكن هناك تاريخ بداية أو نهاية، يعتبر متاحاً
        if (!exam.available_from && !exam.available_until) return true;
        
        const from = exam.available_from ? new Date(exam.available_from) : null;
        const until = exam.available_until ? new Date(exam.available_until) : null;

        // إذا لم يبدأ بعد
        if (from && from > now2) return false;
        
        // حتى لو انتهى، نعرضه إذا كان الطالب قد حاول (لعرض النتائج)
        if (until && until < now2 && exam.attempts_used === 0) return false;

        return true;
      });

      return filteredExams;
    },
    enabled: !!studentId,
    refetchInterval: 60000, // polling كل دقيقة كـ fallback
    refetchIntervalInBackground: false,
  });
};
