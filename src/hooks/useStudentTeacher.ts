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

    // Get all teachers assigned to the class
    const { data: teacherClassesList, error: teacherClassError } = await supabase
      .from('teacher_classes')
      .select('teacher_id')
      .eq('class_id', classStudentData.class_id);

    if (teacherClassError || !teacherClassesList || teacherClassesList.length === 0) {
      console.error('Error fetching teachers:', teacherClassError);
      return null;
    }

    // Get profiles for all teachers
    const teacherIds = teacherClassesList.map(tc => tc.teacher_id);
    const { data: teacherProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, role')
      .in('user_id', teacherIds);

    if (profileError || !teacherProfiles || teacherProfiles.length === 0) {
      console.error('Error fetching teacher profiles:', profileError);
      return null;
    }

    // Prioritize teacher role over school_admin
    const primaryTeacher = teacherProfiles.find(p => p.role === 'teacher') 
                           || teacherProfiles[0];

    return {
      id: primaryTeacher.user_id,
      full_name: primaryTeacher.full_name,
      avatar_url: primaryTeacher.avatar_url || undefined
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
