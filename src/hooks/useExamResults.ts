import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';

// جلب نتائج امتحان محدد
export const useExamResults = (examId: string | null) => {
  return useQuery({
    queryKey: ['exam-results', examId],
    queryFn: async () => {
      if (!examId) return null;
      
      logger.debug(`جلب نتائج الامتحان ${examId}`);
      
      // جلب المحاولات
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('status', 'submitted')
        .order('percentage', { ascending: false });
      
      if (attemptsError) {
        logger.error('خطأ في جلب المحاولات', attemptsError);
        throw attemptsError;
      }
      
      // تسجيل البيانات للتحقق
      logger.debug('📊 بيانات المحاولات من قاعدة البيانات', { 
        count: attemptsData?.length || 0,
        samples: attemptsData?.slice(0, 3).map(a => ({
          id: a.id.substring(0, 8),
          time_spent_seconds: a.time_spent_seconds
        })) || []
      });
      
      if (!attemptsData || attemptsData.length === 0) {
        return {
          results: [],
          stats: {
            total_attempts: 0,
            avg_percentage: 0,
            pass_rate: 0,
            passing_percentage: 50,
          }
        };
      }
      
      // جلب معلومات الامتحان
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('title, total_points, passing_percentage')
        .eq('id', examId)
        .single();
      
      if (examError) {
        logger.error('خطأ في جلب معلومات الامتحان', examError);
        throw examError;
      }
      
      // جلب معلومات الطلاب - student_id في exam_attempts هو user_id
      const studentUserIds = [...new Set(attemptsData.map(a => a.student_id))];
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, user_id')
        .in('user_id', studentUserIds);
      
      if (studentsError) {
        logger.error('خطأ في جلب معلومات الطلاب', studentsError);
        throw studentsError;
      }
      
      // دمج البيانات - student_id في attempts = user_id في students
      const studentsMap = new Map(studentsData?.map(s => [s.user_id, s]) || []);
      const data = attemptsData.map(attempt => {
        const student = studentsMap.get(attempt.student_id);
        return {
          ...attempt,
          students: student || { id: '', full_name: 'غير معروف', user_id: attempt.student_id },
          exams: examData
        };
      });
      
      // حساب الإحصائيات
      const avgPercentage = data.length > 0
        ? data.reduce((sum, a) => sum + (a.percentage || 0), 0) / data.length
        : 0;
      
      const passRate = data.length > 0
        ? (data.filter(a => a.passed).length / data.length) * 100
        : 0;
      
      return {
        results: data.map(attempt => ({
          id: attempt.id,
          student_id: attempt.student_id,
          student_name: attempt.students.full_name,
          attempt_number: attempt.attempt_number,
          score: attempt.score || 0,
          total_points: attempt.exams.total_points,
          percentage: attempt.percentage || 0,
          passed: attempt.passed || false,
          time_spent_seconds: attempt.time_spent_seconds || 0,
          time_spent_minutes: Math.floor((attempt.time_spent_seconds || 0) / 60),
          submitted_at: attempt.submitted_at,
        })),
        stats: {
          total_attempts: data.length,
          avg_percentage: Number(avgPercentage.toFixed(1)),
          pass_rate: Number(passRate.toFixed(1)),
          passing_percentage: data[0]?.exams.passing_percentage || 50,
        }
      };
    },
    enabled: !!examId,
  });
};

// جلب نتائج طالب محدد
export const useStudentResults = (studentUserId: string | null, gradeLevel: string) => {
  return useQuery({
    queryKey: ['student-results', studentUserId, gradeLevel],
    queryFn: async () => {
      if (!studentUserId) return null;
      
      logger.debug(`جلب نتائج الطالب ${studentUserId}`);
      
      // جلب student_id من user_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', studentUserId)
        .maybeSingle();
      
      if (studentError || !studentData) {
        logger.error('خطأ في جلب معرف الطالب', studentError);
        return null;
      }
      
      // جلب المحاولات
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true });
      
      if (attemptsError) {
        logger.error('خطأ في جلب المحاولات', attemptsError);
        throw attemptsError;
      }
      
      if (!attemptsData || attemptsData.length === 0) {
        return {
          results: [],
          stats: {
            total_exams: 0,
            avg_percentage: 0,
            total_improvement: 0,
            trend: 'stable',
          }
        };
      }
      
      // جلب معلومات الامتحانات
      const examIds = [...new Set(attemptsData.map(a => a.exam_id))];
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('id, title, total_points, grade_levels')
        .in('id', examIds);
      
      if (examsError) {
        logger.error('خطأ في جلب معلومات الامتحانات', examsError);
        throw examsError;
      }
      
      // دمج البيانات
      const examsMap = new Map(examsData?.map(e => [e.id, e]) || []);
      const data = attemptsData.map(attempt => {
        const exam = examsMap.get(attempt.exam_id);
        return {
          ...attempt,
          exams: exam || { 
            id: attempt.exam_id, 
            title: 'غير معروف', 
            total_points: 0, 
            grade_levels: [] 
          }
        };
      });
      
      // فلترة حسب الصف
      const filteredData = data.filter(attempt => 
        attempt.exams.grade_levels.includes(gradeLevel)
      );
      
      // حساب التحسن بين المحاولات
      const resultsWithImprovement = filteredData.map((attempt, index) => {
        const previousAttempt = index > 0 ? filteredData[index - 1] : null;
        const improvement = previousAttempt 
          ? (attempt.percentage || 0) - (previousAttempt.percentage || 0)
          : null;
        
        return {
          id: attempt.id,
          exam_id: attempt.exam_id,
          exam_title: attempt.exams.title,
          attempt_number: attempt.attempt_number,
          score: attempt.score || 0,
          total_points: attempt.exams.total_points,
          percentage: attempt.percentage || 0,
          passed: attempt.passed || false,
          time_spent_minutes: Math.floor(attempt.time_spent_seconds / 60),
          submitted_at: attempt.submitted_at,
          improvement: improvement ? Number(improvement.toFixed(1)) : null,
          improvement_percentage: previousAttempt && improvement !== null
            ? Number(((improvement / (previousAttempt.percentage || 1)) * 100).toFixed(1))
            : null,
        };
      });
      
      // حساب الإحصائيات
      const avgPercentage = filteredData.length > 0
        ? filteredData.reduce((sum, a) => sum + (a.percentage || 0), 0) / filteredData.length
        : 0;
      
      const totalImprovement = resultsWithImprovement.length > 1
        ? (resultsWithImprovement[resultsWithImprovement.length - 1].percentage || 0) - 
          (resultsWithImprovement[0].percentage || 0)
        : 0;
      
      return {
        results: resultsWithImprovement,
        stats: {
          total_exams: filteredData.length,
          avg_percentage: Number(avgPercentage.toFixed(1)),
          total_improvement: Number(totalImprovement.toFixed(1)),
          trend: totalImprovement > 0 ? 'improving' : totalImprovement < 0 ? 'declining' : 'stable',
        }
      };
    },
    enabled: !!studentUserId,
  });
};

// جلب قائمة الطلاب للمقارنة
export const useStudentsForComparison = (examId: string | null) => {
  return useQuery({
    queryKey: ['students-comparison', examId],
    queryFn: async () => {
      if (!examId) return [];
      
      // جلب المحاولات للحصول على student_ids
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('student_id')
        .eq('exam_id', examId)
        .eq('status', 'submitted');
      
      if (attemptsError) throw attemptsError;
      
      const studentIds = [...new Set(attemptsData?.map(a => a.student_id) || [])];
      
      if (studentIds.length === 0) return [];
      
      // جلب معلومات الطلاب
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, user_id')
        .in('id', studentIds);
      
      if (error) throw error;
      
      // البيانات المرجعة هي طلاب مباشرة
      const uniqueStudents = Array.from(
        new Map((data || []).map(student => [
          student.id,
          {
            id: student.id,
            user_id: student.user_id,
            name: student.full_name
          }
        ])).values()
      );
      
      return uniqueStudents;
    },
    enabled: !!examId,
  });
};
