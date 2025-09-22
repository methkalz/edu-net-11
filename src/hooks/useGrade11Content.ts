import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Grade11Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  created_by?: string;
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

export const useGrade11Content = () => {
  const [sections, setSections] = useState<Grade11SectionWithTopics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = async () => {
    try {
      setLoading(true);
      
      // Fetch sections with topics, lessons and media
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
      logger.error('Error fetching Grade 11 sections', error as Error);
      toast.error('حدث خطأ في تحميل أقسام الصف الحادي عشر');
    } finally {
      setLoading(false);
    }
  };

  const addSection = async (sectionData: Omit<Grade11Section, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade11_sections')
        .insert([sectionData])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إضافة القسم بنجاح');
      fetchSections();
      return data;
    } catch (error) {
      logger.error('Error adding section', error as Error);
      toast.error('حدث خطأ في إضافة القسم');
      throw error;
    }
  };

  const updateSection = async (id: string, updates: Partial<Grade11Section>) => {
    try {
      const { error } = await supabase
        .from('grade11_sections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث القسم بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error updating section', error as Error);
      toast.error('حدث خطأ في تحديث القسم');
      throw error;
    }
  };

  const deleteSection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade11_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف القسم بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error deleting section', error as Error);
      toast.error('حدث خطأ في حذف القسم');
      throw error;
    }
  };

  const addTopic = async (topicData: Omit<Grade11Topic, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade11_topics')
        .insert([topicData])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إضافة الموضوع بنجاح');
      fetchSections();
      return data;
    } catch (error) {
      logger.error('Error adding topic', error as Error);
      toast.error('حدث خطأ في إضافة الموضوع');
      throw error;
    }
  };

  const updateTopic = async (id: string, updates: Partial<Grade11Topic>) => {
    try {
      const { error } = await supabase
        .from('grade11_topics')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث الموضوع بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error updating topic', error as Error);
      toast.error('حدث خطأ في تحديث الموضوع');
      throw error;
    }
  };

  const deleteTopic = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade11_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الموضوع بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error deleting topic', error as Error);
      toast.error('حدث خطأ في حذف الموضوع');
      throw error;
    }
  };

  const addLesson = async (lessonData: Omit<Grade11Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade11_lessons')
        .insert([lessonData])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إضافة الدرس بنجاح');
      fetchSections();
      return data;
    } catch (error) {
      logger.error('Error adding lesson', error as Error);
      toast.error('حدث خطأ في إضافة الدرس');
      throw error;
    }
  };

  const updateLesson = async (id: string, updates: Partial<Grade11Lesson>) => {
    try {
      const { error } = await supabase
        .from('grade11_lessons')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث الدرس بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error updating lesson', error as Error);
      toast.error('حدث خطأ في تحديث الدرس');
      throw error;
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade11_lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الدرس بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error deleting lesson', error as Error);
      toast.error('حدث خطأ في حذف الدرس');
      throw error;
    }
  };

  const addLessonMedia = async (mediaData: Omit<Grade11LessonMedia, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade11_lesson_media')
        .insert([mediaData])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إضافة الوسائط بنجاح');
      fetchSections();
      return data;
    } catch (error) {
      logger.error('Error adding lesson media', error as Error);
      toast.error('حدث خطأ في إضافة الوسائط');
      throw error;
    }
  };

  const deleteLessonMedia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade11_lesson_media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الوسائط بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error deleting lesson media', error as Error);
      toast.error('حدث خطأ في حذف الوسائط');
      throw error;
    }
  };

  // Reordering functions
  const reorderSections = async (newSections: Grade11SectionWithTopics[]) => {
    try {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        order_index: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('grade11_sections')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('تم تحديث ترتيب الأقسام بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error reordering sections', error as Error);
      toast.error('حدث خطأ في تحديث ترتيب الأقسام');
      throw error;
    }
  };

  const reorderTopics = async (sectionId: string, newTopics: Grade11TopicWithLessons[]) => {
    try {
      const updates = newTopics.map((topic, index) => ({
        id: topic.id,
        order_index: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('grade11_topics')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('تم تحديث ترتيب المواضيع بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error reordering topics', error as Error);
      toast.error('حدث خطأ في تحديث ترتيب المواضيع');
      throw error;
    }
  };

  const reorderLessons = async (topicId: string, newLessons: Grade11LessonWithMedia[]) => {
    try {
      const updates = newLessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('grade11_lessons')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('تم تحديث ترتيب الدروس بنجاح');
      fetchSections();
    } catch (error) {
      logger.error('Error reordering lessons', error as Error);
      toast.error('حدث خطأ في تحديث ترتيب الدروس');
      throw error;
    }
  };

  const updateLessonMedia = async (mediaId: string, updates: Partial<Grade11LessonMedia>) => {
    try {
      console.log('Updating lesson media and refreshing sections...');
      
      // After database update, refresh all sections to get updated data
      await fetchSections();
      
      console.log('Sections refreshed after media update');
    } catch (error) {
      logger.error('Error updating lesson media', error as Error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return {
    sections,
    loading,
    fetchSections,
    addSection,
    updateSection,
    deleteSection,
    addTopic,
    updateTopic,
    deleteTopic,
    addLesson,
    updateLesson,
    deleteLesson,
    addLessonMedia,
    deleteLessonMedia,
    updateLessonMedia,
    reorderSections,
    reorderTopics,
    reorderLessons
  };
};