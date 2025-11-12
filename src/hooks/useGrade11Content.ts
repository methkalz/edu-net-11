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
  media_type: 'video' | 'lottie' | 'image' | 'code' | 'audio';
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
  const [saving, setSaving] = useState(false);

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
      setSaving(true);
      const { data, error } = await supabase
        .from('grade11_sections')
        .insert([sectionData])
        .select()
        .single();

      if (error) throw error;

      const newSection = { ...data, topics: [] } as Grade11SectionWithTopics;
      setSections(prev => [...prev, newSection]);
      toast.success('تم إضافة القسم بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding section', error as Error);
      toast.error('حدث خطأ في إضافة القسم');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async (id: string, updates: Partial<Grade11Section>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade11_sections')
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
      toast.error('حدث خطأ في تحديث القسم');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade11_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(prev => prev.filter(section => section.id !== id));
      toast.success('تم حذف القسم بنجاح');
    } catch (error) {
      logger.error('Error deleting section', error as Error);
      toast.error('حدث خطأ في حذف القسم');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const addTopic = async (topicData: Omit<Grade11Topic, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade11_topics')
        .insert([topicData])
        .select()
        .single();

      if (error) throw error;

      const newTopic = { ...data, lessons: [] } as Grade11TopicWithLessons;
      setSections(prev => prev.map(section => 
        section.id === data.section_id 
          ? { ...section, topics: [...section.topics, newTopic] }
          : section
      ));
      toast.success('تم إضافة الموضوع بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding topic', error as Error);
      toast.error('حدث خطأ في إضافة الموضوع');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateTopic = async (id: string, updates: Partial<Grade11Topic>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade11_topics')
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
      toast.error('حدث خطأ في تحديث الموضوع');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteTopic = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade11_topics')
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
      toast.error('حدث خطأ في حذف الموضوع');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const addLesson = async (lessonData: Omit<Grade11Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade11_lessons')
        .insert([lessonData])
        .select()
        .single();

      if (error) throw error;

      const newLesson = { ...data, media: [] } as Grade11LessonWithMedia;
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
      toast.error('حدث خطأ في إضافة الدرس');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateLesson = async (id: string, updates: Partial<Grade11Lesson>) => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('grade11_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Optimistic Update - تحديث محلي فوري بدون refresh
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
    } catch (error) {
      logger.error('Error updating lesson', error as Error);
      toast.error('حدث خطأ في تحديث الدرس');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade11_lessons')
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
      toast.error('حدث خطأ في حذف الدرس');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const addLessonMedia = async (mediaData: Omit<Grade11LessonMedia, 'id' | 'created_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('grade11_lesson_media')
        .insert([mediaData])
        .select()
        .single();

      if (error) throw error;

      const newMedia: Grade11LessonMedia = {
        ...data,
        metadata: data.metadata as Record<string, any> | null
      };

      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          lessons: topic.lessons.map(lesson => 
            lesson.id === data.lesson_id
              ? { ...lesson, media: [...(lesson.media || []), newMedia] }
              : lesson
          )
        }))
      })));
      toast.success('تم إضافة الوسائط بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding lesson media', error as Error);
      toast.error('حدث خطأ في إضافة الوسائط');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteLessonMedia = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('grade11_lesson_media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(prev => prev.map(section => ({
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          lessons: topic.lessons.map(lesson => ({
            ...lesson,
            media: lesson.media?.filter(media => media.id !== id) || []
          }))
        }))
      })));
      toast.success('تم حذف الوسائط بنجاح');
    } catch (error) {
      logger.error('Error deleting lesson media', error as Error);
      toast.error('حدث خطأ في حذف الوسائط');
      throw error;
    } finally {
      setSaving(false);
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
      console.log('=== UPDATE LESSON MEDIA START ===');
      console.log('Media ID:', mediaId);
      console.log('Updates:', updates);
      
      // تحديث الـ state محلياً بدلاً من إعادة fetch كل البيانات
      setSections(prevSections => {
        const updatedSections = prevSections.map(section => ({
          ...section,
          topics: section.topics.map(topic => ({
            ...topic,
            lessons: topic.lessons?.map(lesson => ({
              ...lesson,
              media: lesson.media?.map(media => {
                if (media.id === mediaId) {
                  console.log('Found media to update:', media.id);
                  console.log('Old metadata:', media.metadata);
                  const updatedMedia = { ...media, ...updates };
                  console.log('New metadata:', updatedMedia.metadata);
                  return updatedMedia;
                }
                return media;
              })
            }))
          }))
        }));
        
        console.log('State updated, returning new sections');
        return updatedSections;
      });
      
      console.log('=== UPDATE LESSON MEDIA END ===');
    } catch (error) {
      logger.error('Error updating lesson media locally', error as Error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return {
    sections,
    loading,
    saving,
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