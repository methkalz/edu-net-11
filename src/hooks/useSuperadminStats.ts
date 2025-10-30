import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TIMES } from '@/lib/query-keys';

interface OverviewStats {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  avg_student_teacher_ratio: number;
  total_points: number;
  last_updated: string;
}

interface SchoolStats {
  school_id: string;
  school_name: string;
  city: string;
  package_name: string;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  student_teacher_ratio: number;
  avg_student_points: number;
  total_points: number;
  last_refreshed: string;
}

interface ActivityTrend {
  date: string;
  total_active_students: number;
  total_active_teachers: number;
  avg_session_duration: number;
  peak_hour: number;
  school_name: string;
}

export const useSuperadminStats = () => {
  // 1. جلب الإحصائيات الإجمالية
  const { data: overviewStats, isLoading: overviewLoading } = useQuery({
    queryKey: ['superadmin-overview-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_superadmin_overview_stats');
      if (error) throw error;
      return data as OverviewStats;
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  // 2. جلب إحصائيات المدارس
  const { data: schoolsStats, isLoading: schoolsLoading } = useQuery({
    queryKey: ['superadmin-schools-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('superadmin_school_stats')
        .select('*')
        .order('total_students', { ascending: false });
      if (error) throw error;
      return data as SchoolStats[];
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  // 3. جلب اتجاهات النشاط
  const { data: activityTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['school-activity-trends', 30],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_school_activity_trends', {
        p_school_id: null,
        p_days: 30
      });
      if (error) throw error;
      return data as ActivityTrend[];
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  return {
    overviewStats,
    schoolsStats,
    activityTrends,
    isLoading: overviewLoading || schoolsLoading || trendsLoading,
  };
};
