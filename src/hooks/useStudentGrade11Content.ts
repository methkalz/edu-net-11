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
  metadata: Record<string, any>;
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
      
      // Fetch sections with topics, lessons and media (read-only for students)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('grade11_sections')
        .select(`
          *,
          grade11_topics (
            *,
            grade11_lessons (
              *,
              grade11_lesson_media (*)
            )
          )
        `)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      const formattedSections = sectionsData?.map(section => ({
        ...section,
        topics: section.grade11_topics
          ?.map((topic: any) => ({
            ...topic,
            lessons: topic.grade11_lessons
              ?.map((lesson: any) => ({
                ...lesson,
                media: lesson.grade11_lesson_media || []
              }))
              .sort((a: any, b: any) => a.order_index - b.order_index) || []
          }))
          .sort((a: any, b: any) => a.order_index - b.order_index) || []
      })) || [];

      setSections(formattedSections);
    } catch (error) {
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