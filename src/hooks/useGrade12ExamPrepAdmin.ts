import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Interfaces
export interface Grade12ExamPrepSection {
  id: string;
  title: string;
  description?: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Grade12ExamPrepTopic {
  id: string;
  section_id: string;
  title: string;
  content?: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Grade12ExamPrepLesson {
  id: string;
  topic_id: string;
  title: string;
  content?: string | null;
  order_index: number;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Grade12ExamPrepLessonMedia {
  id: string;
  lesson_id: string;
  media_type: string;
  file_path?: string | null;
  file_name?: string | null;
  order_index: number;
  metadata?: Record<string, any> | null;
  created_at: string;
}

// Extended interfaces for nested data
export interface Grade12ExamPrepSectionWithTopics extends Grade12ExamPrepSection {
  topics: Grade12ExamPrepTopicWithLessons[];
}

export interface Grade12ExamPrepTopicWithLessons extends Grade12ExamPrepTopic {
  lessons: Grade12ExamPrepLessonWithMedia[];
}

export interface Grade12ExamPrepLessonWithMedia extends Grade12ExamPrepLesson {
  media: Grade12ExamPrepLessonMedia[];
}

export const useGrade12ExamPrepAdmin = () => {
  const [sections, setSections] = useState<Grade12ExamPrepSectionWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all content with nested structure
  const fetchAllContent = async () => {
    try {
      setLoading(true);
      
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('grade12_exam_prep_sections')
        .select('*')
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('grade12_exam_prep_topics')
        .select('*')
        .order('order_index');

      if (topicsError) throw topicsError;

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('grade12_exam_prep_lessons')
        .select('*')
        .order('order_index');

      if (lessonsError) throw lessonsError;

      // Fetch lesson media
      const { data: mediaData, error: mediaError } = await supabase
        .from('grade12_exam_prep_lesson_media')
        .select('*')
        .order('order_index');

      if (mediaError) throw mediaError;

        const sectionsWithContent = (sectionsData || []).map(section => {
          const sectionTopics = (topicsData || []).filter(topic => topic.section_id === section.id);
          
          const topicsWithLessons = sectionTopics.map(topic => {
            const topicLessons = (lessonsData || []).filter(lesson => lesson.topic_id === topic.id);
            
            const lessonsWithMedia = topicLessons.map(lesson => {
              const lessonMedia = (mediaData || []).filter(media => media.lesson_id === lesson.id);
              return {
                ...lesson,
                media: lessonMedia
              } as Grade12ExamPrepLessonWithMedia;
            });

            return {
              ...topic,
              lessons: lessonsWithMedia
            };
          });

          return {
            ...section,
            topics: topicsWithLessons
          };
        });

        setSections(sectionsWithContent);
    } catch (error) {
      logger.error('Error fetching Grade 12 exam prep content', error as Error);
      toast.error('فشل في تحميل المحتوى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContent();
  }, []);

  // Section operations
  const addSection = async (sectionData: Omit<Grade12ExamPrepSection, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade12_exam_prep_sections')
        .insert(sectionData)
        .select()
        .single();

      if (error) throw error;

      const newSection = { ...data, topics: [] } as Grade12ExamPrepSectionWithTopics;
      setSections(prev => [...prev, newSection]);
      toast.success('تم إضافة القسم بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding section', error as Error);
      toast.error('فشل في إضافة القسم');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async (id: string, updates: Partial<Grade12ExamPrepSection>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade12_exam_prep_sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSections(prev => prev.map(section => 
        section.id === id ? { ...section, ...data } : section
      ));
      toast.success('تم تحديث القسم بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating section', error as Error);
      toast.error('فشل في تحديث القسم');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade12_exam_prep_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(prev => prev.filter(section => section.id !== id));
      toast.success('تم حذف القسم بنجاح');
    } catch (error) {
      logger.error('Error deleting section', error as Error);
      toast.error('فشل في حذف القسم');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Topic operations
  const addTopic = async (topicData: Omit<Grade12ExamPrepTopic, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade12_exam_prep_topics')
        .insert(topicData)
        .select()
        .single();

      if (error) throw error;

      const newTopic = { ...data, lessons: [] };
      setSections(prev => prev.map(section => 
        section.id === data.section_id 
          ? { ...section, topics: [...section.topics, newTopic] }
          : section
      ));
      toast.success('تم إضافة الموضوع بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding topic', error as Error);
      toast.error('فشل في إضافة الموضوع');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateTopic = async (id: string, updates: Partial<Grade12ExamPrepTopic>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade12_exam_prep_topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.map(topic => 
          topic.id === id ? { ...topic, ...data } : topic
        )
      })));
      toast.success('تم تحديث الموضوع بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating topic', error as Error);
      toast.error('فشل في تحديث الموضوع');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteTopic = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade12_exam_prep_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.filter(topic => topic.id !== id)
      })));
      toast.success('تم حذف الموضوع بنجاح');
    } catch (error) {
      logger.error('Error deleting topic', error as Error);
      toast.error('فشل في حذف الموضوع');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Lesson operations
  const addLesson = async (lessonData: Omit<Grade12ExamPrepLesson, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade12_exam_prep_lessons')
        .insert(lessonData)
        .select()
        .single();

      if (error) throw error;

      const newLesson = { ...data, media: [] } as Grade12ExamPrepLessonWithMedia;
      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.map(topic => 
          topic.id === data.topic_id
            ? { ...topic, lessons: [...topic.lessons, newLesson] }
            : topic
        )
      })));
      toast.success('تم إضافة الدرس بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding lesson', error as Error);
      toast.error('فشل في إضافة الدرس');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateLesson = async (id: string, updates: Partial<Grade12ExamPrepLesson>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade12_exam_prep_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          lessons: topic.lessons.map(lesson => 
            lesson.id === id ? { ...lesson, ...data } : lesson
          )
        }))
      })));
      toast.success('تم تحديث الدرس بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating lesson', error as Error);
      toast.error('فشل في تحديث الدرس');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade12_exam_prep_lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          lessons: topic.lessons.filter(lesson => lesson.id !== id)
        }))
      })));
      toast.success('تم حذف الدرس بنجاح');
    } catch (error) {
      logger.error('Error deleting lesson', error as Error);
      toast.error('فشل في حذف الدرس');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    sections,
    loading,
    saving,
    fetchAllContent,
    // Section operations
    addSection,
    updateSection,
    deleteSection,
    // Topic operations
    addTopic,
    updateTopic,
    deleteTopic,
    // Lesson operations
    addLesson,
    updateLesson,
    deleteLesson
  };
};