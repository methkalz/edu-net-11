import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';
import { PerformanceMonitor } from '@/lib/performance-monitor';

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

// ⚡ المرحلة 1: جلب البنية الأساسية فقط (sections + topics بدون محتوى الدروس)
const fetchGrade11Structure = async (): Promise<any[]> => {
  return PerformanceMonitor.measure('fetchGrade11Structure', async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_sections')
        .select(`
          id, title, description, order_index,
          topics:grade11_topics(
            id, title, order_index,
            lessons_count:grade11_lessons(count)
          )
        `)
        .order('order_index');

      if (error) {
        logger.error('Error fetching Grade 11 structure', error as Error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // ترتيب المواضيع
      return data.map(section => ({
        ...section,
        topics: (section.topics || []).sort((a, b) => a.order_index - b.order_index)
      }));
    } catch (error) {
      logger.error('Error fetching Grade 11 structure', error as Error);
      throw error;
    }
  });
};

// ⚡ المرحلة 2: جلب دروس موضوع معين عند الحاجة
export const fetchTopicLessons = async (topicId: string): Promise<any[]> => {
  return PerformanceMonitor.measure(`fetchTopicLessons-${topicId}`, async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_lessons')
        .select(`
          id, title, order_index,
          media_count:grade11_lesson_media(count)
        `)
        .eq('topic_id', topicId)
        .order('order_index');

      if (error) {
        logger.error(`Error fetching lessons for topic ${topicId}`, error as Error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`Error fetching lessons for topic ${topicId}`, error as Error);
      throw error;
    }
  });
};

// ⚡ المرحلة 3: جلب محتوى درس كامل مع الوسائط عند فتحه
export const fetchLessonContent = async (lessonId: string): Promise<Grade11LessonWithMedia | null> => {
  return PerformanceMonitor.measure(`fetchLessonContent-${lessonId}`, async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_lessons')
        .select(`
          *,
          media:grade11_lesson_media(*)
        `)
        .eq('id', lessonId)
        .single();

      if (error) {
        logger.error(`Error fetching lesson content ${lessonId}`, error as Error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        media: (data.media || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map(media => ({
            ...media,
            metadata: media.metadata as Record<string, any> | null
          }))
      };
    } catch (error) {
      logger.error(`Error fetching lesson content ${lessonId}`, error as Error);
      throw error;
    }
  });
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
  // ⚡ جلب البنية الأساسية فقط (خفيف جداً ~10KB بدلاً من 15MB+)
  const {
    data: structure = [],
    isLoading: structureLoading,
    error: structureError,
    refetch: refetchStructure
  } = useQuery({
    queryKey: QUERY_KEYS.GRADE_CONTENT.GRADE_11_SECTIONS(),
    queryFn: fetchGrade11Structure,
    staleTime: CACHE_TIMES.VERY_LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1
  });

  // Videos query - أخف وأسرع
  const {
    data: videos = [],
    isLoading: videosLoading,
    error: videosError
  } = useQuery({
    queryKey: QUERY_KEYS.GRADE_CONTENT.GRADE_11_VIDEOS(),
    queryFn: fetchGrade11Videos,
    staleTime: CACHE_TIMES.VERY_LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    enabled: !!structure.length // تحميل Videos بعد Structure
  });

  const loading = structureLoading || videosLoading;
  const error = structureError?.message || videosError?.message || null;

  // Get statistics for student dashboard
  const getContentStats = () => {
    const structureArray = structure as any[];
    const videosArray = videos as Grade11Video[];
    
    const totalSections = structureArray.length;
    const totalTopics = structureArray.reduce((acc, section) => 
      acc + (section.topics?.length || 0), 0
    );
    // حساب الدروس من lessons_count
    const totalLessons = structureArray.reduce((acc, section) => 
      acc + (section.topics || []).reduce((topicAcc: number, topic: any) => 
        topicAcc + (topic.lessons_count?.[0]?.count || 0), 0
      ), 0
    );
    const totalMedia = 0; // سنحسبه لاحقاً عند تحميل الدروس
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
    refetchStructure();
  };

  return {
    structure: structure as any[],
    videos: videos as Grade11Video[],
    loading,
    error,
    getContentStats,
    refetch,
    // تصدير دوال التحميل الإضافية
    fetchTopicLessons,
    fetchLessonContent
  };
};