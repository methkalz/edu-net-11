import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

export interface Grade10Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Grade10Topic {
  id: string;
  section_id: string;
  title: string;
  content?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Grade10Lesson {
  id: string;
  topic_id: string;
  title: string;
  content?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  media?: Grade10LessonMedia[];
}

export interface Grade10LessonMedia {
  id: string;
  lesson_id: string;
  media_type: 'video' | 'lottie' | 'image' | 'code' | '3d_model';
  file_path: string;
  file_name: string;
  metadata: Record<string, any> | null;
  order_index: number;
  created_at: string;
}

export interface Grade10SectionWithTopics extends Grade10Section {
  topics: Grade10TopicWithLessons[];
}

export interface Grade10TopicWithLessons extends Grade10Topic {
  lessons: Grade10LessonWithMedia[];
}

export interface Grade10LessonWithMedia extends Grade10Lesson {
  media: Grade10LessonMedia[];
}

// Fetch functions
const fetchGrade10Sections = async (): Promise<Grade10SectionWithTopics[]> => {
  try {
    // Fetch sections using raw SQL since tables might not be in types yet
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('grade10_sections' as any)
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
      sectionsData.map(async (section: any) => {
        const { data: topicsData, error: topicsError } = await supabase
          .from('grade10_topics' as any)
          .select('*')
          .eq('section_id', section.id)
          .order('order_index');

        if (topicsError) {
          console.error('Topics error for section:', section.id, topicsError);
          return { ...section, topics: [] };
        }

        // Fetch lessons for each topic
        const topicsWithLessons = await Promise.all(
          (topicsData || []).map(async (topic: any) => {
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('grade10_lessons' as any)
              .select('*')
              .eq('topic_id', topic.id)
              .eq('is_active', true)
              .order('order_index');

            if (lessonsError) {
              console.error('Lessons error for topic:', topic.id, lessonsError);
              return { ...topic, lessons: [] };
            }

            // Fetch media for each lesson
            const lessonsWithMedia = await Promise.all(
              (lessonsData || []).map(async (lesson: any) => {
                const { data: mediaData, error: mediaError } = await supabase
                  .from('grade10_lesson_media' as any)
                  .select('*')
                  .eq('lesson_id', lesson.id)
                  .order('order_index');

                if (mediaError) {
                  console.error('Media error for lesson:', lesson.id, mediaError);
                  return { ...lesson, media: [] };
                }

                return {
                  ...lesson,
                  media: (mediaData || []).map((media: any) => ({
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

    return sectionsWithContent as Grade10SectionWithTopics[];
  } catch (error) {
    console.error('Complete error in fetchGrade10Sections:', error);
    logger.error('Error fetching Grade 10 content for student', error as Error);
    throw error;
  }
};

export const useStudentGrade10Lessons = () => {
  // Sections query
  const {
    data: sections = [],
    isLoading: sectionsLoading,
    error: sectionsError,
    refetch: refetchSections
  } = useQuery({
    queryKey: QUERY_KEYS.GRADE_CONTENT.GRADE_10_SECTIONS(),
    queryFn: fetchGrade10Sections,
    staleTime: CACHE_TIMES.LONG, // Cache for 1 hour
    gcTime: CACHE_TIMES.VERY_LONG, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    }
  });

  const loading = sectionsLoading;
  const error = sectionsError?.message || null;

  // Get statistics for student dashboard
  const getContentStats = () => {
    const sectionsArray = sections as Grade10SectionWithTopics[];
    
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

    return {
      totalSections,
      totalTopics,
      totalLessons,
      totalMedia,
      totalVideos: 0 // Grade 10 doesn't have separate videos table yet
    };
  };

  const refetch = () => {
    refetchSections();
  };

  return {
    sections: sections as Grade10SectionWithTopics[],
    loading,
    error,
    getContentStats,
    refetch
  };
};