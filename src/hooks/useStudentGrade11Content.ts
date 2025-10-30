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

// ⚡ Phase 1: Fetch Structure Only (Sections + Topics - Lightweight)
const fetchGrade11Structure = async (): Promise<Grade11SectionWithTopics[]> => {
  try {
    const { data, error } = await supabase
      .from('grade11_sections')
      .select(`
        id,
        title,
        description,
        order_index,
        created_at,
        updated_at,
        topics:grade11_topics(
          id,
          section_id,
          title,
          content,
          order_index,
          created_at,
          updated_at
        )
      `)
      .order('order_index');

    if (error) {
      console.error('Structure fetch error:', error);
      logger.error('Error fetching Grade 11 structure', error as Error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Sort topics by order_index and initialize empty lessons array
    return data.map(section => ({
      ...section,
      topics: (section.topics || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(topic => ({
          ...topic,
          lessons: [] // Will be loaded on-demand
        }))
    }));
  } catch (error) {
    console.error('Error in fetchStructure:', error);
    logger.error('Error fetching Grade 11 structure', error as Error);
    throw error;
  }
};

// ⚡ Phase 2: Fetch Topic Lessons (On-Demand Lazy Load)
export const fetchTopicLessons = async (topicId: string): Promise<Grade11LessonWithMedia[]> => {
  try {
    const { data, error } = await supabase
      .from('grade11_lessons')
      .select(`
        id,
        topic_id,
        title,
        content,
        order_index,
        created_at,
        updated_at,
        media:grade11_lesson_media(*)
      `)
      .eq('topic_id', topicId)
      .order('order_index');

    if (error) {
      console.error('Lessons fetch error:', error);
      throw error;
    }

    return (data || []).map(lesson => ({
      ...lesson,
      media: (lesson.media || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((media: any) => ({
          ...media,
          metadata: media.metadata as Record<string, any> | null
        }))
    }));
  } catch (error) {
    console.error('Error fetching topic lessons:', error);
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

export const useStudentGrade11Content = (options?: { enabled?: boolean }) => {
  // Structure query (lightweight - only sections + topics)
  const {
    data: sections = [],
    isLoading: sectionsLoading,
    error: sectionsError,
    refetch: refetchSections
  } = useQuery({
    queryKey: QUERY_KEYS.GRADE_CONTENT.GRADE_11_SECTIONS(),
    queryFn: fetchGrade11Structure,
    enabled: options?.enabled !== false,
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