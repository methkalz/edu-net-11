import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logging';

interface StudentExam {
  id: string;
  template_id: string;
  is_active: boolean;
  max_attempts: number;
  starts_at: string;
  ends_at?: string;
  last_attempt_start_time?: string;
  exam_templates: {
    title: string;
    description?: string;
    total_questions: number;
    duration_minutes: number;
    pass_percentage: number;
    grade_level: string;
  };
}

interface CategorizedExams {
  active: StudentExam[];
  upcoming: StudentExam[];
  expired: StudentExam[];
}

export const useStudentExams = () => {
  const { userProfile } = useAuth();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudentExams = useCallback(async () => {
    if (!userProfile?.user_id) return;

    try {
      setLoading(true);

      // جلب صفوف الطالب
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.user_id)
        .single();

      if (!studentData) return;

      const { data: classData } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentData.id);

      const classIds = classData?.map(c => c.class_id) || [];

      if (classIds.length === 0) return;

      // جلب الاختبارات النشطة والقادمة
      const { data: examsData, error } = await supabase
        .from('teacher_exam_instances')
        .select(`
          *,
          exam_templates(
            title,
            description,
            total_questions,
            duration_minutes,
            pass_percentage,
            grade_level
          )
        `)
        .eq('is_active', true)
        .overlaps('target_class_ids', classIds);

      if (error) throw error;

      setExams(examsData || []);
    } catch (error) {
      logger.error('Error fetching student exams', error as Error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.user_id]);

  useEffect(() => {
    fetchStudentExams();
  }, [fetchStudentExams]);

  // تصنيف الامتحانات حسب الحالة
  const categorizeExams = (): CategorizedExams => {
    const now = new Date();
    
    return exams.reduce(
      (acc, exam) => {
        const startsAt = new Date(exam.starts_at);
        const lastAttemptTime = exam.last_attempt_start_time 
          ? new Date(exam.last_attempt_start_time) 
          : null;
        
        // منتهي - إذا كان آخر وقت للبدء قد انتهى
        if (lastAttemptTime && lastAttemptTime < now) {
          acc.expired.push(exam);
        }
        // قادم - إذا كان موعد البدء لم يأت بعد
        else if (startsAt > now) {
          acc.upcoming.push(exam);
        }
        // جاري - بدأ ولم ينتهي
        else {
          acc.active.push(exam);
        }
        
        return acc;
      },
      { active: [], upcoming: [], expired: [] } as CategorizedExams
    );
  };

  // حساب الوقت المتبقي بالدقائق
  const getTimeRemaining = (targetDate: string): number => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffMs = target.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  return {
    exams,
    loading,
    refetch: fetchStudentExams,
    categorizeExams,
    getTimeRemaining,
  };
};
