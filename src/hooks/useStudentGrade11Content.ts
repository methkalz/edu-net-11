import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

export interface Grade11Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Grade11Topic {
  id: string;
  section_id: string;
  title: string;
  content?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Grade11Lesson {
  id: string;
  topic_id: string;
  title: string;
  content?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  media?: Grade11LessonMedia[];
}

export interface Grade11LessonMedia {
  id: string;
  lesson_id: string;
  media_type: 'video' | 'lottie' | 'image' | 'code';
  file_path: string;
  file_name: string;
  metadata: Record<string, any> | null;
  order_index: number;
  created_at: string;
}

export interface Grade11SectionWithTopics extends Grade11Section {
  topics: Grade11TopicWithLessons[];
}

export interface Grade11TopicWithLessons extends Grade11Topic {
  lessons: Grade11LessonWithMedia[];
}

export interface Grade11LessonWithMedia extends Grade11Lesson {
  media: Grade11LessonMedia[];
}

export interface Grade11Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  duration?: string;
  category: string;
  thumbnail_url?: string;
  grade_level: string;
  school_id: string;
  owner_user_id: string;
  is_active: boolean;
  is_visible: boolean;
  order_index: number;
  source_type: string;
  created_at: string;
  updated_at: string;
}

// Fetch functions with optimized Nested Joins (single query instead of N+1)
const fetchGrade11Sections = async (): Promise<Grade11SectionWithTopics[]> => {
  try {
    // ⚡ Optimized: Single query with nested joins instead of multiple queries
    const { data, error } = await supabase
      .from('grade11_sections')
      .select(`
        *,
        topics:grade11_topics(
          *,
          lessons:grade11_lessons(
            *,
            media:grade11_lesson_media(*)
          )
        )
      `)
      .order('order_index');

    if (error) {
      console.error('Sections fetch error:', error);
      logger.error('Error fetching Grade 11 content for student', error as Error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Sort nested relations by order_index (Supabase doesn't support ORDER BY in nested selects yet)
    return data.map(section => ({
      ...section,
      topics: (section.topics || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(topic => ({
          ...topic,
          lessons: (topic.lessons || [])
            .sort((a, b) => a.order_index - b.order_index)
            .map(lesson => ({
              ...lesson,
              media: (lesson.media || [])
                .sort((a, b) => a.order_index - b.order_index)
                .map(media => ({
                  ...media,
                  metadata: media.metadata as Record<string, any> | null
                }))
            }))
        }))
    }));
  } catch (error) {
    console.error('Complete error in fetchSections:', error);
    logger.error('Error fetching Grade 11 content for student', error as Error);
    throw error;
  }
};

const fetchGrade11Videos = async (): Promise<Grade11Video[]> => {
  try {
    const { data: videosData, error: videosError } = await supabase
      .from('grade11_videos')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('order_index');

    if (videosError) {
      console.error('Videos error:', videosError);
      throw videosError;
    }

    return videosData || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

export const useStudentGrade11Content = () => {
  // Sections query
  const {
    data: sections = [],
    isLoading: sectionsLoading,
    error: sectionsError,
    refetch: refetchSections
  } = useQuery({
    queryKey: QUERY_KEYS.GRADE_CONTENT.GRADE_11_SECTIONS(),
    queryFn: fetchGrade11Sections,
    staleTime: CACHE_TIMES.LONG, // Cache for 1 hour - content doesn't change often
    gcTime: CACHE_TIMES.VERY_LONG, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    }
  });

  // Videos query
  const {
    data: videos = [],
    isLoading: videosLoading,
    error: videosError
  } = useQuery({
    queryKey: QUERY_KEYS.GRADE_CONTENT.GRADE_11_VIDEOS(),
    queryFn: fetchGrade11Videos,
    staleTime: CACHE_TIMES.MEDIUM, // Cache for 15 minutes
    gcTime: CACHE_TIMES.LONG, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    }
  });

  const loading = sectionsLoading || videosLoading;
  const error = sectionsError?.message || videosError?.message || null;

  // Get statistics for student dashboard
  const getContentStats = () => {
    const sectionsArray = sections as Grade11SectionWithTopics[];
    const videosArray = videos as Grade11Video[];
    
    const totalSections = sectionsArray.length;
    const totalTopics = sectionsArray.reduce((acc, section) => acc + section.topics.length, 0);
    const totalLessons = sectionsArray.reduce((acc, section) => 
      acc + section.topics.reduce((topicAcc, topic) => topicAcc + topic.lessons.length, 0), 0
    );
    const totalMedia = sectionsArray.reduce((acc, section) => 
      acc + section.topics.reduce((topicAcc, topic) => 
        topicAcc + topic.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.media.length, 0), 0
      ), 0
    );
    const totalVideos = videosArray.length;

    return {
      totalSections,
      totalTopics,
      totalLessons,
      totalMedia,
      totalVideos
    };
  };

  const refetch = () => {
    refetchSections();
  };

  return {
    sections: sections as Grade11SectionWithTopics[],
    videos: videos as Grade11Video[],
    loading,
    error,
    getContentStats,
    refetch
  };
};