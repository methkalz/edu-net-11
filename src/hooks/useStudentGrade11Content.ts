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

// Fetch functions
const fetchGrade11Sections = async (): Promise<Grade11SectionWithTopics[]> => {
  try {
    // First, try to fetch sections only to check if basic access works
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('grade11_sections')
      .select('*')
      .order('order_index');

    if (sectionsError) {
      console.error('Sections error:', sectionsError);
      throw sectionsError;
    }

    if (!sectionsData || sectionsData.length === 0) {
      return [];
    }

    // Fetch topics for each section
    const sectionsWithContent = await Promise.all(
      sectionsData.map(async (section) => {
        const { data: topicsData, error: topicsError } = await supabase
          .from('grade11_topics')
          .select('*')
          .eq('section_id', section.id)
          .order('order_index');

        if (topicsError) {
          console.error('Topics error for section:', section.id, topicsError);
          return { ...section, topics: [] };
        }

        // Fetch lessons for each topic
        const topicsWithLessons = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('grade11_lessons')
              .select('*')
              .eq('topic_id', topic.id)
              .order('order_index');

            if (lessonsError) {
              console.error('Lessons error for topic:', topic.id, lessonsError);
              return { ...topic, lessons: [] };
            }

            // Fetch media for each lesson
            const lessonsWithMedia = await Promise.all(
              (lessonsData || []).map(async (lesson) => {
                const { data: mediaData, error: mediaError } = await supabase
                  .from('grade11_lesson_media')
                  .select('*')
                  .eq('lesson_id', lesson.id)
                  .order('order_index');

                if (mediaError) {
                  console.error('Media error for lesson:', lesson.id, mediaError);
                  return { ...lesson, media: [] };
                }

                return {
                  ...lesson,
                  media: (mediaData || []).map(media => ({
                    ...media,
                    metadata: media.metadata as Record<string, any> | null
                  }))
                };
              })
            );

            return {
              ...topic,
              lessons: lessonsWithMedia
            };
          })
        );

        return {
          ...section,
          topics: topicsWithLessons
        };
      })
    );

    return sectionsWithContent;
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