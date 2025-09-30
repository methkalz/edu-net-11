/**
 * Teacher Student Tracking Hook
 * Hook متخصص لتتبع تقدم الطلاب للمعلمين
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

export interface StudentProgress {
  id: string;
  student_id: string;
  content_id: string;
  content_type: 'video' | 'document' | 'lesson' | 'project' | 'game';
  progress_percentage: number;
  time_spent_minutes: number;
  points_earned: number;
  last_accessed_at: string;
}

export interface StudentActivity {
  id: string;
  student_id: string;
  activity_type: string;
  content_id?: string;
  duration_seconds?: number;
  points_earned?: number;
  created_at: string;
  metadata?: any;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  points_value: number;
  earned_at: string;
}

export interface StudentPresenceInfo {
  student_id: string;
  is_online: boolean;
  last_seen_at: string;
  current_page?: string;
}

export interface StudentWithTracking {
  id: string;
  full_name: string;
  username: string;
  email: string;
  class_name?: string;
  grade_level?: string;
  total_points: number;
  completion_percentage: number;
  last_activity_at?: string;
  is_online: boolean;
  progress_summary: {
    videos_watched: number;
    documents_read: number;
    games_played: number;
    projects_submitted: number;
    total_activities: number;
  };
  recent_activities: StudentActivity[];
  achievements_count: number;
}

interface TeacherStudentTrackingFilters {
  classId?: string;
  gradeLevel?: string;
  searchQuery?: string;
  onlineOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

const fetchTeacherStudents = async (
  teacherId: string,
  schoolId: string,
  filters?: TeacherStudentTrackingFilters
) => {
  logger.debug('Fetching teacher students with tracking', { teacherId, schoolId, filters });

  // جلب الصفوف المخصصة للمعلم
  const { data: teacherClasses, error: classesError } = await supabase
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', teacherId);

  if (classesError) throw classesError;

  if (!teacherClasses || teacherClasses.length === 0) {
    return [];
  }

  const classIds = teacherClasses.map(tc => tc.class_id);

  // جلب الطلاب في هذه الصفوف مع تفاصيلهم
  let studentsQuery = supabase
    .from('class_students')
    .select(`
      student_id,
      students!inner(
        id,
        full_name,
        username,
        email,
        user_id
      ),
      classes!inner(
        id,
        grade_levels!inner(label),
        class_names!inner(name)
      )
    `)
    .in('class_id', classIds);

  // تطبيق الفلاتر
  if (filters?.classId) {
    studentsQuery = studentsQuery.eq('class_id', filters.classId);
  }

  const { data: studentsData, error: studentsError } = await studentsQuery;

  if (studentsError) throw studentsError;

  if (!studentsData || studentsData.length === 0) {
    return [];
  }

  // استخراج معرفات الطلاب - استخدام user_id للتتبع بدلاً من student_id
  const studentIds = studentsData.map(s => s.students.id);
  const userIds = studentsData.map(s => s.students.user_id);

  console.log('🔍 Teacher Tracking Debug:', {
    studentsCount: studentsData.length,
    studentIds: studentIds,
    userIds: userIds,
    message: 'استخدام user_id للبحث في جداول التتبع'
  });

  // جلب بيانات التتبع بالتوازي - استخدام user_id بدلاً من student_id
  const [progressData, activitiesData, achievementsData, presenceData, statsData] = await Promise.all([
    // Progress data - استخدام user_id
    supabase
      .from('student_progress')
      .select('*')
      .in('student_id', userIds)
      .order('updated_at', { ascending: false }),
    
    // Activities data - استخدام user_id
    supabase
      .from('student_activity_log')
      .select('*')
      .in('student_id', userIds)
      .order('created_at', { ascending: false })
      .limit(100),
    
    // Achievements data - استخدام user_id
    supabase
      .from('student_achievements')
      .select('*')
      .in('student_id', userIds),
    
    // Presence data - استخدام student_id للـ presence
    supabase
      .from('student_presence')
      .select('*')
      .in('student_id', studentIds),
    
    // Dashboard stats for each student - استخدام user_id
    Promise.all(
      userIds.map(userId =>
        supabase.rpc('get_student_dashboard_stats', { student_uuid: userId })
      )
    )
  ]);

  console.log('📊 Tracking Data Fetched:', {
    progressCount: progressData.data?.length || 0,
    activitiesCount: activitiesData.data?.length || 0,
    achievementsCount: achievementsData.data?.length || 0,
    presenceCount: presenceData.data?.length || 0
  });

  // تجميع البيانات لكل طالب
  const studentsWithTracking: StudentWithTracking[] = studentsData.map((enrollment, index) => {
    const student = enrollment.students;
    const studentId = student.id;
    const userId = student.user_id; // استخدام user_id للتتبع
    const classInfo = enrollment.classes;

    // Progress data for this student - استخدام user_id
    const studentProgress = progressData.data?.filter(p => p.student_id === userId) || [];
    
    // Activities for this student - استخدام user_id
    const studentActivities = activitiesData.data?.filter(a => a.student_id === userId) || [];
    
    // Achievements for this student - استخدام user_id
    const studentAchievements = achievementsData.data?.filter(a => a.student_id === userId) || [];
    
    // Presence info
    const presenceInfo = presenceData.data?.find(p => p.student_id === studentId);
    
    // Stats from RPC
    const studentStatsRaw = statsData[index]?.data as any;
    const studentStats = studentStatsRaw || {
      total_points: 0,
      completed_videos: 0,
      completed_projects: 0,
      total_activities: 0,
      achievements_count: 0
    };

    // حساب نسبة الإنجاز العامة
    const completedItems = studentProgress.filter(p => p.progress_percentage === 100).length;
    const totalItems = studentProgress.length || 1;
    const completionPercentage = Math.round((completedItems / totalItems) * 100);

    // تلخيص أنواع التقدم
    const progressSummary = {
      videos_watched: studentProgress.filter(p => p.content_type === 'video' && p.progress_percentage > 0).length,
      documents_read: studentProgress.filter(p => p.content_type === 'document' && p.progress_percentage > 0).length,
      games_played: studentProgress.filter(p => p.content_type === 'game' && p.progress_percentage > 0).length,
      projects_submitted: studentProgress.filter(p => p.content_type === 'project' && p.progress_percentage > 0).length,
      total_activities: studentActivities.length
    };

    // آخر نشاط
    const lastActivity = studentActivities[0]?.created_at;

    console.log(`📈 Student ${student.full_name} Tracking:`, {
      studentId,
      userId,
      progressCount: studentProgress.length,
      activitiesCount: studentActivities.length,
      achievementsCount: studentAchievements.length,
      totalPoints: studentStats.total_points || 0,
      completionPercentage,
      progressSummary
    });

    return {
      id: studentId,
      full_name: student.full_name,
      username: student.username,
      email: student.email,
      class_name: classInfo.class_names?.name,
      grade_level: classInfo.grade_levels?.label,
      total_points: studentStats.total_points || 0,
      completion_percentage: completionPercentage,
      last_activity_at: lastActivity,
      is_online: presenceInfo?.is_online || false,
      progress_summary: progressSummary,
      recent_activities: studentActivities.slice(0, 10),
      achievements_count: studentAchievements.length
    };
  });

  // تطبيق فلاتر إضافية
  let filteredStudents = studentsWithTracking;

  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredStudents = filteredStudents.filter(
      s =>
        s.full_name.toLowerCase().includes(query) ||
        s.username?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
    );
  }

  if (filters?.onlineOnly) {
    filteredStudents = filteredStudents.filter(s => s.is_online);
  }

  if (filters?.gradeLevel) {
    filteredStudents = filteredStudents.filter(s => s.grade_level?.includes(filters.gradeLevel!));
  }

  logger.info('Teacher students tracking loaded', {
    totalStudents: filteredStudents.length,
    filters
  });

  return filteredStudents;
};

export const useTeacherStudentTracking = (filters?: TeacherStudentTrackingFilters) => {
  const { user, userProfile } = useAuth();

  const {
    data: students = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.TEACHER.STUDENT_TRACKING(
      userProfile?.user_id || '',
      userProfile?.school_id || '',
      JSON.stringify(filters || {})
    ),
    queryFn: () =>
      fetchTeacherStudents(
        userProfile?.user_id || '',
        userProfile?.school_id || '',
        filters
      ),
    enabled: Boolean(userProfile?.user_id && userProfile?.school_id && userProfile?.role === 'teacher'),
    staleTime: CACHE_TIMES.SHORT, // 5 minutes
    gcTime: CACHE_TIMES.MEDIUM, // 15 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // تحديث كل دقيقتين
  });

  // إحصائيات سريعة
  const quickStats = {
    totalStudents: students.length,
    onlineStudents: students.filter(s => s.is_online).length,
    activeToday: students.filter(s => {
      if (!s.last_activity_at) return false;
      const today = new Date();
      const activityDate = new Date(s.last_activity_at);
      return activityDate.toDateString() === today.toDateString();
    }).length,
    averageCompletion: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.completion_percentage, 0) / students.length)
      : 0,
    totalPoints: students.reduce((sum, s) => sum + s.total_points, 0)
  };

  return {
    students,
    loading,
    error,
    refetch,
    quickStats
  };
};
