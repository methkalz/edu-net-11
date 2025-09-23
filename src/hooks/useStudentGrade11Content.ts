import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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

export const useStudentGrade11Content = () => {
  const [sections, setSections] = useState<Grade11SectionWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
        setSections([]);
        return;
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

      setSections(sectionsWithContent);
    } catch (error) {
      console.error('Complete error in fetchSections:', error);
      logger.error('Error fetching Grade 11 content for student', error as Error);
      setError('حدث خطأ في تحميل المحتوى التعليمي');
      toast.error('حدث خطأ في تحميل المحتوى التعليمي');
    } finally {
      setLoading(false);
    }
  };

  // Get statistics for student dashboard
  const getContentStats = () => {
    const totalSections = sections.length;
    const totalTopics = sections.reduce((acc, section) => acc + section.topics.length, 0);
    const totalLessons = sections.reduce((acc, section) => 
      acc + section.topics.reduce((topicAcc, topic) => topicAcc + topic.lessons.length, 0), 0
    );
    const totalMedia = sections.reduce((acc, section) => 
      acc + section.topics.reduce((topicAcc, topic) => 
        topicAcc + topic.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.media.length, 0), 0
      ), 0
    );

    return {
      totalSections,
      totalTopics,
      totalLessons,
      totalMedia
    };
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return {
    sections,
    loading,
    error,
    getContentStats,
    refetch: fetchSections
  };
};