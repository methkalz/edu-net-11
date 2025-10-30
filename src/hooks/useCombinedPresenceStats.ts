import { useMemo } from 'react';
import { useTeacherPresence } from './useTeacherPresence';
import { useStudentPresence } from './useStudentPresence';

export interface CombinedUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'student' | 'teacher' | 'school_admin';
  is_online: boolean;
  last_seen_at: string | null;
  current_page: string | null;
  total_time_minutes: number;
  login_count: number;
  last_login_at: string | null;
  school_id: string | null;
  school_name: string | null;
  class_name?: string | null;
}

export interface SchoolStats {
  school_id: string;
  school_name: string;
  active_students: number;
  active_teachers: number;
  total_session_time: number;
  avg_session_time: number;
  most_visited_page: string | null;
}

export const useCombinedPresenceStats = () => {
  const { 
    teachers, 
    loading: teachersLoading, 
    error: teachersError,
    onlineTeachers,
    offlineTeachers 
  } = useTeacherPresence();
  
  const { 
    onlineStudents, 
    recentlyLeftStudents,
    loading: studentsLoading
  } = useStudentPresence();

  const loading = teachersLoading || studentsLoading;
  const error = teachersError;

  // Combine all users (teachers and students) into a unified list
  const allUsers = useMemo((): CombinedUser[] => {
    const teacherUsers: CombinedUser[] = teachers.map(t => ({
      id: t.id,
      user_id: t.user_id,
      full_name: t.full_name,
      email: t.email,
      role: t.role as 'teacher' | 'school_admin',
      is_online: t.is_online,
      last_seen_at: t.last_seen_at,
      current_page: t.current_page,
      total_time_minutes: t.total_time_minutes || 0,
      login_count: t.login_count || 0,
      last_login_at: t.last_login_at,
      school_id: null,
      school_name: null
    }));

    const studentUsers: CombinedUser[] = [...onlineStudents, ...recentlyLeftStudents].map(s => ({
      id: s.student_id,
      user_id: s.user_id,
      full_name: s.student.full_name,
      email: s.student.email || '',
      role: 'student' as const,
      is_online: s.is_online,
      last_seen_at: s.last_seen_at,
      current_page: s.current_page || null,
      total_time_minutes: 0,
      login_count: 0,
      last_login_at: null,
      school_id: s.school_id,
      school_name: null,
      class_name: s.class_info?.class_name || null
    }));

    return [...teacherUsers, ...studentUsers];
  }, [teachers, onlineStudents, recentlyLeftStudents]);

  // Calculate KPIs
  const stats = useMemo(() => {
    const onlineStudentsCount = onlineStudents.length;
    const onlineTeachersCount = onlineTeachers.length;
    const totalOnline = onlineStudentsCount + onlineTeachersCount;
    
    // Calculate active schools (schools with at least one online user)
    const activeSchoolIds = new Set<string>();
    allUsers.forEach(user => {
      if (user.is_online && user.school_id) {
        activeSchoolIds.add(user.school_id);
      }
    });

    // Calculate average session time
    const usersWithTime = allUsers.filter(u => u.total_time_minutes > 0);
    const avgSessionTime = usersWithTime.length > 0
      ? usersWithTime.reduce((sum, u) => sum + u.total_time_minutes, 0) / usersWithTime.length
      : 0;

    return {
      totalOnline,
      onlineStudents: onlineStudentsCount,
      onlineTeachers: onlineTeachersCount,
      activeSchools: activeSchoolIds.size,
      avgSessionTime: Math.round(avgSessionTime),
      totalUsers: allUsers.length
    };
  }, [allUsers, onlineStudents, onlineTeachers]);

  // Calculate school-specific stats
  const schoolStats = useMemo((): SchoolStats[] => {
    const schoolMap = new Map<string, SchoolStats>();

    allUsers.forEach(user => {
      if (!user.school_id || !user.school_name) return;

      if (!schoolMap.has(user.school_id)) {
        schoolMap.set(user.school_id, {
          school_id: user.school_id,
          school_name: user.school_name,
          active_students: 0,
          active_teachers: 0,
          total_session_time: 0,
          avg_session_time: 0,
          most_visited_page: null
        });
      }

      const schoolStat = schoolMap.get(user.school_id)!;

      if (user.is_online) {
        if (user.role === 'student') {
          schoolStat.active_students++;
        } else {
          schoolStat.active_teachers++;
        }
      }

      schoolStat.total_session_time += user.total_time_minutes;
    });

    // Calculate averages
    schoolMap.forEach(stat => {
      const totalUsers = stat.active_students + stat.active_teachers;
      if (totalUsers > 0) {
        stat.avg_session_time = Math.round(stat.total_session_time / totalUsers);
      }
    });

    return Array.from(schoolMap.values()).sort(
      (a, b) => (b.active_students + b.active_teachers) - (a.active_students + a.active_teachers)
    );
  }, [allUsers]);

  // Get recently active users (online + recently left)
  const recentlyActive = useMemo(() => {
    return allUsers.filter(u => u.is_online || 
      (u.last_seen_at && new Date(u.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000))
    ).sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      
      const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [allUsers]);

  return {
    allUsers,
    recentlyActive,
    stats,
    schoolStats,
    loading,
    error
  };
};
