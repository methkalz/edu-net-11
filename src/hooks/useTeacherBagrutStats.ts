import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BagrutExamForTeacher {
  id: string;
  title: string;
  subject: string;
  exam_year: number;
  exam_season: string;
  available_for_grades: string[];
  total_points: number;
  duration_minutes: number;
  studentAttempts: number;
  pendingGrading: number;
  gradedCount: number;
  publishedCount: number;
  averageScore: number | null;
}

export interface TeacherBagrutStats {
  // امتحانات البجروت المتاحة
  availableExams: number;
  publishedForGrade11: number;
  publishedForGrade12: number;
  
  // محاولات الطلاب
  totalStudentAttempts: number;
  submittedAttempts: number;
  gradedAttempts: number;
  pendingGrading: number;
  publishedResults: number;
  
  // إحصائيات الأداء
  studentsParticipated: number;
  averageScore: number;
  passRate: number;
  
  // قائمة الامتحانات مع تفاصيلها
  examsWithDetails: BagrutExamForTeacher[];
}

interface UseTeacherBagrutStatsOptions {
  canAccessGrade11: boolean;
  canAccessGrade12: boolean;
}

export function useTeacherBagrutStats({ canAccessGrade11, canAccessGrade12 }: UseTeacherBagrutStatsOptions) {
  const { userProfile } = useAuth();
  
  // تحديد الصفوف المتاحة للمعلم
  const accessibleGrades: string[] = [];
  if (canAccessGrade11) accessibleGrades.push('11');
  if (canAccessGrade12) accessibleGrades.push('12');

  return useQuery({
    queryKey: ['teacher-bagrut-stats', userProfile?.school_id, accessibleGrades],
    queryFn: async (): Promise<TeacherBagrutStats> => {
      if (!userProfile?.school_id || accessibleGrades.length === 0) {
        return getEmptyStats();
      }

      // 1. جلب امتحانات البجروت المنشورة للصفوف المتاحة
      const { data: exams, error: examsError } = await supabase
        .from('bagrut_exams')
        .select('id, title, subject, exam_year, exam_season, available_for_grades, total_points, duration_minutes')
        .eq('is_published', true);

      if (examsError) throw examsError;

      // تصفية الامتحانات حسب الصفوف المتاحة للمعلم
      const filteredExams = (exams || []).filter(exam => {
        const examGrades = exam.available_for_grades || [];
        return examGrades.some((grade: string) => accessibleGrades.includes(grade));
      });

      const examIds = filteredExams.map(e => e.id);

      // 2. جلب محاولات طلاب المدرسة لهذه الامتحانات
      let attempts: any[] = [];
      if (examIds.length > 0) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('bagrut_attempts')
          .select('id, exam_id, student_id, status, percentage, is_result_published')
          .eq('school_id', userProfile.school_id)
          .in('exam_id', examIds);

        if (attemptsError) throw attemptsError;
        attempts = attemptsData || [];
      }

      // 3. حساب الإحصائيات
      const uniqueStudents = new Set(attempts.map(a => a.student_id));
      const submittedAttempts = attempts.filter(a => a.status === 'submitted');
      const gradedAttempts = attempts.filter(a => a.status === 'graded');
      const publishedResults = attempts.filter(a => a.is_result_published === true);
      
      // حساب معدل العلامات ونسبة النجاح
      const gradedWithScores = gradedAttempts.filter(a => a.percentage !== null);
      const averageScore = gradedWithScores.length > 0
        ? Math.round(gradedWithScores.reduce((sum, a) => sum + (a.percentage || 0), 0) / gradedWithScores.length)
        : 0;
      
      const passingAttempts = gradedWithScores.filter(a => (a.percentage || 0) >= 55);
      const passRate = gradedWithScores.length > 0
        ? Math.round((passingAttempts.length / gradedWithScores.length) * 100)
        : 0;

      // 4. إنشاء تفاصيل كل امتحان
      const examsWithDetails: BagrutExamForTeacher[] = filteredExams.map(exam => {
        const examAttempts = attempts.filter(a => a.exam_id === exam.id);
        const examGraded = examAttempts.filter(a => a.status === 'graded');
        const examPending = examAttempts.filter(a => a.status === 'submitted');
        const examPublished = examAttempts.filter(a => a.is_result_published === true);
        
        const examGradedWithScores = examGraded.filter(a => a.percentage !== null);
        const examAvg = examGradedWithScores.length > 0
          ? Math.round(examGradedWithScores.reduce((sum, a) => sum + (a.percentage || 0), 0) / examGradedWithScores.length)
          : null;

        return {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          exam_year: exam.exam_year,
          exam_season: exam.exam_season,
          available_for_grades: exam.available_for_grades || [],
          total_points: exam.total_points || 100,
          duration_minutes: exam.duration_minutes || 180,
          studentAttempts: examAttempts.length,
          pendingGrading: examPending.length,
          gradedCount: examGraded.length,
          publishedCount: examPublished.length,
          averageScore: examAvg,
        };
      });

      // ترتيب الامتحانات: بانتظار التصحيح أولاً، ثم حسب السنة
      examsWithDetails.sort((a, b) => {
        if (a.pendingGrading > 0 && b.pendingGrading === 0) return -1;
        if (a.pendingGrading === 0 && b.pendingGrading > 0) return 1;
        return b.exam_year - a.exam_year;
      });

      // حساب عدد الامتحانات لكل صف
      const grade11Exams = filteredExams.filter(e => 
        (e.available_for_grades || []).includes('11')
      ).length;
      const grade12Exams = filteredExams.filter(e => 
        (e.available_for_grades || []).includes('12')
      ).length;

      return {
        availableExams: filteredExams.length,
        publishedForGrade11: grade11Exams,
        publishedForGrade12: grade12Exams,
        totalStudentAttempts: attempts.length,
        submittedAttempts: submittedAttempts.length,
        gradedAttempts: gradedAttempts.length,
        pendingGrading: submittedAttempts.length,
        publishedResults: publishedResults.length,
        studentsParticipated: uniqueStudents.size,
        averageScore,
        passRate,
        examsWithDetails,
      };
    },
    enabled: !!userProfile?.school_id && accessibleGrades.length > 0,
    staleTime: 30 * 1000, // 30 ثانية
    refetchInterval: 60 * 1000, // تحديث كل دقيقة
  });
}

function getEmptyStats(): TeacherBagrutStats {
  return {
    availableExams: 0,
    publishedForGrade11: 0,
    publishedForGrade12: 0,
    totalStudentAttempts: 0,
    submittedAttempts: 0,
    gradedAttempts: 0,
    pendingGrading: 0,
    publishedResults: 0,
    studentsParticipated: 0,
    averageScore: 0,
    passRate: 0,
    examsWithDetails: [],
  };
}
