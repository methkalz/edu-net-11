import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CACHE_TIMES } from '@/lib/query-keys';

export interface StudentTrackingData {
  student_id: string;
  student_name: string;
  student_email: string;
  total_time_minutes: number;
  videos_watched: number;
  documents_read: number;
  lessons_completed: number;
  projects_completed: number;
  games_played: number;
  total_points: number;
  last_activity: string | null;
}

async function getTeacherProfile(userId: string) {
  const response = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('user_id', userId)
    .single();
  return response.data;
}

async function getSchoolStudents(schoolId: string) {
  const response = await supabase
    .from('students')
    .select('id, user_id, full_name, email')
    .eq('school_id', schoolId)
    .eq('is_active', true);
  return response.data || [];
}

async function getStudentProgress(studentIds: string[]) {
  if (studentIds.length === 0) return [];
  const response = await supabase
    .from('student_progress')
    .select('*')
    .in('student_id', studentIds);
  return response.data || [];
}

async function getStudentActivities(studentIds: string[]) {
  if (studentIds.length === 0) return [];
  const response = await supabase
    .from('student_activity_log')
    .select('*')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });
  return response.data || [];
}

async function getStudentAchievements(studentIds: string[]) {
  if (studentIds.length === 0) return [];
  const response = await supabase
    .from('student_achievements')
    .select('*')
    .in('student_id', studentIds);
  return response.data || [];
}

const fetchTeacherStudents = async (teacherUserId: string, schoolId: string): Promise<StudentTrackingData[]> => {
  try {
    const students = await getSchoolStudents(schoolId);
    if (!students || students.length === 0) return [];

    const studentUserIds = students
      .map((s: any) => s.user_id)
      .filter((id: any): id is string => Boolean(id));

    if (studentUserIds.length === 0) return [];

    const [progress, activities, achievements] = await Promise.all([
      getStudentProgress(studentUserIds),
      getStudentActivities(studentUserIds),
      getStudentAchievements(studentUserIds)
    ]);

    return students
      .filter((s: any) => s.user_id)
      .map((student: any) => {
        const userId = student.user_id;
        const studentProgress = progress.filter((p: any) => p.student_id === userId);
        const studentActivities = activities.filter((a: any) => a.student_id === userId);
        const studentAchievements = achievements.filter((a: any) => a.student_id === userId);

        const totalTimeFromProgress = studentProgress.reduce((sum: number, p: any) => 
          sum + (p.time_spent_minutes || 0), 0
        );
        const totalTimeFromActivities = Math.floor(
          studentActivities.reduce((sum: number, a: any) => 
            sum + (a.duration_seconds || 0), 0
          ) / 60
        );

        const videosWatched = studentProgress.filter((p: any) => 
          p.content_type === 'video' && p.progress_percentage === 100
        ).length;
        
        const documentsRead = studentProgress.filter((p: any) => 
          p.content_type === 'document' && p.progress_percentage === 100
        ).length;
        
        const lessonsCompleted = studentProgress.filter((p: any) => 
          p.content_type === 'lesson' && p.progress_percentage === 100
        ).length;
        
        const projectsCompleted = studentProgress.filter((p: any) => 
          p.content_type === 'project' && p.progress_percentage === 100
        ).length;
        
        const gamesPlayed = studentActivities.filter((a: any) => 
          a.activity_type === 'game_play'
        ).length;

        const totalPoints = 
          studentProgress.reduce((sum: number, p: any) => sum + (p.points_earned || 0), 0) +
          studentActivities.reduce((sum: number, a: any) => sum + (a.points_earned || 0), 0) +
          studentAchievements.reduce((sum: number, a: any) => sum + (a.points_value || 0), 0);

        return {
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.email,
          total_time_minutes: totalTimeFromProgress + totalTimeFromActivities,
          videos_watched: videosWatched,
          documents_read: documentsRead,
          lessons_completed: lessonsCompleted,
          projects_completed: projectsCompleted,
          games_played: gamesPlayed,
          total_points: totalPoints,
          last_activity: studentActivities[0]?.created_at || null,
        };
      });
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

export const useTeacherStudentTracking = () => {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: () => getTeacherProfile(user!.id),
    enabled: !!user?.id,
  });

  const trackingQuery = useQuery({
    queryKey: ['teacher-student-tracking', user?.id, profileQuery.data?.school_id],
    queryFn: () => fetchTeacherStudents(user!.id, profileQuery.data!.school_id),
    enabled: !!user?.id && !!profileQuery.data?.school_id && profileQuery.data?.role === 'teacher',
    staleTime: CACHE_TIMES.SHORT,
  });

  return {
    students: trackingQuery.data || [],
    loading: trackingQuery.isLoading || profileQuery.isLoading,
    error: trackingQuery.error?.message || null,
    refetch: trackingQuery.refetch,
  };
};
