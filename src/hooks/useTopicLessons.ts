import { useQuery } from '@tanstack/react-query';
import { fetchTopicLessons } from './useStudentGrade11Content';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';
import type { Grade11LessonWithMedia } from './useStudentGrade11Content';

/**
 * Hook for lazy loading lessons for a specific topic
 * Used in Phase 2 of performance optimization
 */
export const useTopicLessons = (topicId: string | null) => {
  return useQuery<Grade11LessonWithMedia[]>({
    queryKey: [...QUERY_KEYS.GRADE_CONTENT.GRADE_11_SECTIONS(), 'topic-lessons', topicId],
    queryFn: () => fetchTopicLessons(topicId!),
    enabled: !!topicId,
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    }
  });
};
