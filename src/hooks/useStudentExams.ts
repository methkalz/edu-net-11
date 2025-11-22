// Hook لجلب الامتحانات المتاحة للطالب مع تحديثات فورية
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AvailableExam } from '@/types/exam';
import { logger } from '@/lib/logging';

export const useStudentExams = (studentId?: string) => {
  const queryClient = useQueryClient();

  // إعداد Supabase Realtime subscriptions للتحديثات الفورية
  useEffect(() => {
    if (!studentId) return;

    logger.debug(`إعداد Realtime subscriptions للطالب ${studentId}`);

    // الاستماع لتغييرات جدول exams (تحديث status, start_datetime, end_datetime)
    const examsChannel = supabase
      .channel('student-exams-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'exams'
      }, (payload) => {
        logger.debug('تحديث في جدول exams:', payload);
        // إعادة جلب البيانات لتحديث الحالة
        queryClient.invalidateQueries({ queryKey: ['student-exams', studentId] });
      })
      .subscribe();

    // الاستماع لإضافة محاولات جديدة في exam_attempts
    const attemptsChannel = supabase
      .channel('student-attempts-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'exam_attempts',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        logger.debug('محاولة جديدة:', payload);
        // إعادة جلب البيانات لتحديث attempts_used و attempts_remaining
        queryClient.invalidateQueries({ queryKey: ['student-exams', studentId] });
      })
      .subscribe();

    // تنظيف الاشتراكات عند إلغاء تحميل الـ component
    return () => {
      logger.debug('تنظيف Realtime subscriptions');
      supabase.removeChannel(examsChannel);
      supabase.removeChannel(attemptsChannel);
    };
  }, [studentId, queryClient]);

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
    refetchInterval: 30000, // polling كـ fallback كل 30 ثانية
    refetchIntervalInBackground: false, // فقط عند نشاط الطالب
  });
};
