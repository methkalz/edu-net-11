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
  lessons_count?: number;
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
  lessons?: Grade11LessonWithMedia[];
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

// ⚡ المرحلة 1: جلب الأقسام فقط (بدون مواضيع - Lazy Loading)
const fetchGrade11Structure = async (): Promise<any[]> => {
  return PerformanceMonitor.measure('fetchGrade11Structure', async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_sections')
        .select('id, title, description, order_index')
        .order('order_index');

      if (error) {
        logger.error('Error fetching Grade 11 structure', error as Error);
        throw error;
      }

      // إرجاع الأقسام مع topics فارغة (سنحملها لاحقاً)
      return (data || []).map(section => ({
        ...section,
        topics: []
      }));
    } catch (error) {
      logger.error('Error fetching Grade 11 structure', error as Error);
      throw error;
    }
  });
};

// ⚡ جلب مواضيع قسم معين عند فتحه (Lazy Loading)
export const fetchSectionTopics = async (sectionId: string): Promise<any[]> => {
  return PerformanceMonitor.measure(`fetchSectionTopics-${sectionId}`, async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_topics')
        .select('id, title, content, order_index, lessons_count')
        .eq('section_id', sectionId)
        .order('order_index');

      if (error) {
        logger.error(`Error fetching topics for section ${sectionId}`, error as Error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`Error fetching topics for section ${sectionId}`, error as Error);
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

// ⚡ المرحلة 4ب: جلب دروس عدة مواضيع في طلب واحد (Batch Query)
export const fetchLessonsForTopics = async (topicIds: string[]): Promise<Record<string, any[]>> => {
  return PerformanceMonitor.measure('fetchLessonsForTopics-batch', async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_lessons')
        .select(`
          id, title, order_index, topic_id,
          media_count:grade11_lesson_media(count)
        `)
        .in('topic_id', topicIds)
        .order('order_index');

      if (error) {
        logger.error('Error fetching lessons for topics batch', error as Error);
        throw error;
      }

      // تجميع النتائج حسب topic_id
      const grouped: Record<string, any[]> = {};
      (data || []).forEach(lesson => {
        if (!grouped[lesson.topic_id]) {
          grouped[lesson.topic_id] = [];
        }
        grouped[lesson.topic_id].push(lesson);
      });

      return grouped;
    } catch (error) {
      logger.error('Error fetching lessons for topics batch', error as Error);
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

  // ⚡ Parallel Loading: Videos query بدون enabled (تحميل متزامن مع Structure)
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
    retry: 1
    // ⚡ حذفنا enabled للتحميل المتزامن
  });

  // ⚡ جلب الإحصائيات من View (سريع جداً ~10ms)
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['grade11_content_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grade11_content_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as {
        total_sections: number;
        total_topics: number;
        total_lessons: number;
        total_media: number;
        total_videos: number;
      };
    },
    staleTime: CACHE_TIMES.VERY_LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1
  });

  // ⚡ Loading state يشمل الإحصائيات
  const loading = structureLoading || videosLoading || statsLoading;
  const error = structureError?.message || videosError?.message || null;

  // ⚡ Get statistics من View (سريع جداً)
  const getContentStats = () => {
    // استخدام الإحصائيات من View (أسرع وأدق)
    if (stats) {
      return {
        totalSections: stats.total_sections,
        totalTopics: stats.total_topics,
        totalLessons: stats.total_lessons,
        totalMedia: stats.total_media,
        totalVideos: stats.total_videos,
      };
    }

    // Fallback: حساب يدوي في حال لم يتم تحميل stats بعد
    return {
      totalSections: (structure as any[]).length,
      totalTopics: 0,
      totalLessons: 0,
      totalMedia: 0,
      totalVideos: (videos as Grade11Video[]).length,
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
    fetchSectionTopics, // ⚡ جلب مواضيع قسم محدد
    fetchTopicLessons,
    fetchLessonContent,
    fetchLessonsForTopics
  };
};