import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const fetchGradeStudentCount = async (gradeNumber: number, schoolId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('class_students')
    .select(`
      student_id,
      class:classes!inner(
        id,
        grade_level:grade_levels!inner(
          label,
          code
        )
      )
    `)
    .eq('class.school_id', schoolId);

  if (error) {
    console.error('Error fetching grade student count:', error);
    return 0;
  }

  // تصفية الطلاب حسب الصف
  const studentsInGrade = data?.filter(item => {
    const gradeLevel = item.class?.grade_level;
    if (!gradeLevel) return false;

    // تحديد الصف من التسمية أو الكود
    if (gradeLevel.label?.includes('عاشر') || gradeLevel.code === '10') {
      return gradeNumber === 10;
    }
    if (gradeLevel.label?.includes('حادي عشر') || gradeLevel.code === '11') {
      return gradeNumber === 11;
    }
    if (gradeLevel.label?.includes('ثاني عشر') || gradeLevel.code === '12') {
      return gradeNumber === 12;
    }

    return false;
  }) || [];

  return studentsInGrade.length;
};

export const useGradeStudentCount = (gradeNumber: number) => {
  const { userProfile } = useAuth();

  const {
    data: studentCount = 0,
    isLoading,
    error
  } = useQuery({
    queryKey: ['grade-student-count', gradeNumber, userProfile?.school_id],
    queryFn: () => fetchGradeStudentCount(gradeNumber, userProfile?.school_id || ''),
    enabled: Boolean(userProfile?.school_id && gradeNumber),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    studentCount,
    isLoading,
    error
  };
};