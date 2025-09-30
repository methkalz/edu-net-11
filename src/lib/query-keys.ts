/**
 * Query Keys for React Query
 * 
 * Centralized query keys to ensure consistency and avoid cache conflicts
 */

export const QUERY_KEYS = {
  // Student data
  STUDENT: {
    ASSIGNED_GRADE: (userId: string) => ['student', 'assigned-grade', userId],
    PROGRESS: (userId: string) => ['student', 'progress', userId],
    STATS: (userId: string) => ['student', 'stats', userId],
    ACHIEVEMENTS: (userId: string) => ['student', 'achievements', userId],
    CONTENT: (userId: string, grade: string) => ['student', 'content', userId, grade],
    NOTIFICATIONS: (userId: string) => ['student', 'notifications', userId],
    TEACHER: (userId: string) => ['student', 'teacher', userId],
    GAME_STATS: (userId: string) => ['student', 'game-stats', userId],
  },
  
  // Grade content
  GRADE_CONTENT: {
    GRADE_10_SECTIONS: () => ['grade10', 'sections'],
    GRADE_11: (userId?: string) => ['grade11', 'content', userId],
    GRADE_11_SECTIONS: () => ['grade11', 'sections'],
    GRADE_11_VIDEOS: () => ['grade11', 'videos'],
    VIDEOS: (grade: string) => ['videos', grade],
    DOCUMENTS: (grade: string) => ['documents', grade],
    PROJECTS: (grade: string, userId: string) => ['projects', grade, userId],
    LESSONS: (grade: string) => ['lessons', grade],
  },
  
  // Teacher data
  TEACHER: {
    CONTENT_ACCESS: (teacherId: string, schoolId: string) => ['teacher', 'content-access', teacherId, schoolId],
  },
  
  // School data  
  SCHOOL: {
    PACKAGE: (schoolId: string) => ['school', 'package', schoolId],
    AVAILABLE_GRADES: (schoolId: string, role: string) => ['school', 'available-grades', schoolId, role],
  },
  
  // Calendar data
  CALENDAR: {
    EVENTS: (schoolId: string, limit: number) => ['calendar', 'events', schoolId, limit],
  },
  
  // User data
  USER: {
    PROFILE: (userId: string) => ['user', 'profile', userId],
    LOGIN_TRACKING: () => ['user', 'login-tracking'],
  },
} as const;

/**
 * Cache durations in milliseconds
 */
export const CACHE_TIMES = {
  SHORT: 5 * 60 * 1000,    // 5 minutes - for frequently changing data
  MEDIUM: 15 * 60 * 1000,  // 15 minutes - for moderate changing data
  LONG: 60 * 60 * 1000,    // 1 hour - for rarely changing data
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for static data
} as const;