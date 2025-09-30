import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CACHE_TIMES } from '@/lib/query-keys';

export interface ContentProgress {
  content_id: string;
  content_type: string;
  progress_percentage: number;
  time_spent_minutes: number;
  points_earned: number;
  completed_at: string | null;
  updated_at: string;
}

export interface Grade10ProjectProgress {
  project_id: string;
  title: string;
  progress_percentage: number;
  status: string;
  updated_at: string;
}

export interface Grade12ProjectProgress {
  project_id: string;
  title: string;
  status: string;
  grade: number | null;
  submitted_at: string | null;
  updated_at: string;
}

export interface GameProgress {
  game_id: string;
  game_title: string;
  level: number;
  stage: number;
  is_completed: boolean;
  best_score: number;
  completion_count: number;
}

export interface ProgressDetails {
  content_progress: ContentProgress[];
  grade10_projects: Grade10ProjectProgress[];
  grade12_projects: Grade12ProjectProgress[];
  game_progress: GameProgress[];
}

export interface StudentTrackingData {
  student_id: string;
  student_name: string;
  student_email: string;
  student_grade: string;
  total_time_minutes: number;
  total_points: number;
  last_activity: string | null;
  progress_details: ProgressDetails;
}

export const useTeacherStudentTracking = () => {
  const { user, userProfile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-student-tracking', user?.id, userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_teacher_student_tracking', {
        teacher_user_id: user!.id,
        teacher_school_id: userProfile!.school_id,
      });

      if (error) throw error;
      return (data || []) as unknown as StudentTrackingData[];
    },
    enabled: !!user?.id && !!userProfile?.school_id && userProfile?.role === 'teacher',
    staleTime: CACHE_TIMES.SHORT,
  });

  return {
    students: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};
