import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

interface TeacherInfo {
  id: string;
  full_name: string;
  avatar_url?: string;
}

const fetchStudentTeacher = async (userId: string): Promise<TeacherInfo | null> => {
  try {
    // Get student ID
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student:', studentError);
      return null;
    }

    // Get class ID through class_students
    const { data: classStudentData, error: classStudentError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', studentData.id)
      .limit(1)
      .single();

    if (classStudentError || !classStudentData) {
      console.error('Error fetching class student:', classStudentError);
      return null;
    }

    // Get teacher ID through teacher_classes
    const { data: teacherClassData, error: teacherClassError } = await supabase
      .from('teacher_classes')
      .select('teacher_id')
      .eq('class_id', classStudentData.class_id)
      .limit(1)
      .single();

    if (teacherClassError || !teacherClassData) {
      console.error('Error fetching teacher class:', teacherClassError);
      return null;
    }

    // Get teacher info from profiles
    const { data: teacherProfile, error: teacherProfileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .eq('user_id', teacherClassData.teacher_id)
      .single();

    if (teacherProfileError || !teacherProfile) {
      console.error('Error fetching teacher profile:', teacherProfileError);
      return null;
    }

    return {
      id: teacherProfile.user_id,
      full_name: teacherProfile.full_name,
      avatar_url: teacherProfile.avatar_url || undefined
    };
  } catch (error) {
    console.error('Error in fetchStudentTeacher:', error);
    return null;
  }
};

export const useStudentTeacher = () => {
  const { user, userProfile } = useAuth();

  const {
    data: teacher,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.TEACHER(user?.id || ''),
    queryFn: () => fetchStudentTeacher(user?.id || ''),
    enabled: Boolean(user && userProfile?.role === 'student'),
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: false
  });

  return {
    teacher,
    loading: isLoading,
    error,
    refetch
  };
};
