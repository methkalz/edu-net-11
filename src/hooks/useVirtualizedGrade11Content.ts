import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Grade11Section, Grade11Topic, Grade11Lesson, Grade11LessonMedia } from './useGrade11Content';

interface OptimizedGrade11Section extends Omit<Grade11Section, 'topics'> {
  topics_count: number;
  isLoaded: boolean;
  topics?: OptimizedGrade11Topic[];
}

interface OptimizedGrade11Topic extends Omit<Grade11Topic, 'lessons'> {
  lessons_count: number;
  isLoaded: boolean;
  lessons?: OptimizedGrade11Lesson[];
}

interface OptimizedGrade11Lesson extends Omit<Grade11Lesson, 'media'> {
  media_count: number;
  isLoaded: boolean;
  media?: Grade11LessonMedia[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class ContentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, customDuration?: number): void {
    const expires = Date.now() + (customDuration || this.CACHE_DURATION);
    this.cache.set(key, { data, timestamp: Date.now(), expires });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

const contentCache = new ContentCache();

export const useVirtualizedGrade11Content = () => {
  const [sections, setSections] = useState<OptimizedGrade11Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedTopics, setLoadedTopics] = useState(new Set<string>());
  const [loadedLessons, setLoadedLessons] = useState(new Set<string>());

  // Load sections (lightweight) with topic counts only
  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = 'grade11-sections';
      const cached = contentCache.get<OptimizedGrade11Section[]>(cacheKey);
      
      if (cached) {
        setSections(cached);
        setLoading(false);
        return;
      }

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('grade11_sections')
        .select(`
          *,
          topics:grade11_topics(count)
        `)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      const optimizedSections: OptimizedGrade11Section[] = sectionsData.map(section => ({
        ...section,
        topics_count: section.topics?.length || 0,
        isLoaded: false,
        topics: undefined
      }));

      contentCache.set(cacheKey, optimizedSections);
      setSections(optimizedSections);
    } catch (err: any) {
      console.error('Error loading sections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load topics for a specific section
  const loadTopicsForSection = useCallback(async (sectionId: string) => {
    if (loadedTopics.has(sectionId)) return;

    try {
      const cacheKey = `grade11-topics-${sectionId}`;
      const cached = contentCache.get<OptimizedGrade11Topic[]>(cacheKey);

      if (cached) {
        setSections(prev => prev.map(section => 
          section.id === sectionId 
            ? { ...section, topics: cached, isLoaded: true }
            : section
        ));
        setLoadedTopics(prev => new Set(prev).add(sectionId));
        return;
      }

      const { data: topicsData, error } = await supabase
        .from('grade11_topics')
        .select(`
          *,
          lessons:grade11_lessons(count)
        `)
        .eq('section_id', sectionId)
        .order('order_index');

      if (error) throw error;

      const optimizedTopics: OptimizedGrade11Topic[] = topicsData.map(topic => ({
        ...topic,
        lessons_count: topic.lessons?.length || 0,
        isLoaded: false,
        lessons: undefined
      }));

      contentCache.set(cacheKey, optimizedTopics);
      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, topics: optimizedTopics, isLoaded: true }
          : section
      ));
      setLoadedTopics(prev => new Set(prev).add(sectionId));
    } catch (err: any) {
      console.error(`Error loading topics for section ${sectionId}:`, err);
    }
  }, [loadedTopics]);

  // Load lessons for a specific topic
  const loadLessonsForTopic = useCallback(async (topicId: string, sectionId: string) => {
    if (loadedLessons.has(topicId)) return;

    try {
      const cacheKey = `grade11-lessons-${topicId}`;
      const cached = contentCache.get<OptimizedGrade11Lesson[]>(cacheKey);

      if (cached) {
        setSections(prev => prev.map(section => 
          section.id === sectionId
            ? {
                ...section,
                topics: section.topics?.map(topic =>
                  topic.id === topicId
                    ? { ...topic, lessons: cached, isLoaded: true }
                    : topic
                )
              }
            : section
        ));
        setLoadedLessons(prev => new Set(prev).add(topicId));
        return;
      }

      const { data: lessonsData, error } = await supabase
        .from('grade11_lessons')
        .select(`
          *,
          media:grade11_lesson_media(count)
        `)
        .eq('topic_id', topicId)
        .order('order_index');

      if (error) throw error;

      const optimizedLessons: OptimizedGrade11Lesson[] = lessonsData.map(lesson => ({
        ...lesson,
        media_count: lesson.media?.length || 0,
        isLoaded: false,
        media: undefined
      }));

      contentCache.set(cacheKey, optimizedLessons);
      setSections(prev => prev.map(section => 
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics?.map(topic =>
                topic.id === topicId
                  ? { ...topic, lessons: optimizedLessons, isLoaded: true }
                  : topic
              )
            }
          : section
      ));
      setLoadedLessons(prev => new Set(prev).add(topicId));
    } catch (err: any) {
      console.error(`Error loading lessons for topic ${topicId}:`, err);
    }
  }, [loadedLessons]);

  // Load media for a specific lesson
  const loadMediaForLesson = useCallback(async (lessonId: string): Promise<Grade11LessonMedia[]> => {
    try {
      const cacheKey = `grade11-media-${lessonId}`;
      const cached = contentCache.get<Grade11LessonMedia[]>(cacheKey);

      if (cached) {
        return cached;
      }

      const { data: mediaData, error } = await supabase
        .from('grade11_lesson_media')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at');

      if (error) throw error;

      contentCache.set(cacheKey, mediaData || []);
      return mediaData || [];
    } catch (err: any) {
      console.error(`Error loading media for lesson ${lessonId}:`, err);
      return [];
    }
  }, []);

  // Get full lesson with media (for modal)
  const getFullLesson = useCallback(async (lessonId: string): Promise<Grade11Lesson & { media: Grade11LessonMedia[] } | null> => {
    try {
      const cacheKey = `grade11-full-lesson-${lessonId}`;
      const cached = contentCache.get<Grade11Lesson & { media: Grade11LessonMedia[] }>(cacheKey);

      if (cached) {
        return cached;
      }

      const { data: lessonData, error } = await supabase
        .from('grade11_lessons')
        .select(`
          *,
          media:grade11_lesson_media(*)
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      const fullLesson = {
        ...lessonData,
        media: lessonData.media || []
      };

      contentCache.set(cacheKey, fullLesson, 2 * 60 * 1000); // Cache for 2 minutes only
      return fullLesson;
    } catch (err: any) {
      console.error(`Error loading full lesson ${lessonId}:`, err);
      return null;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    contentCache.clear();
    setLoadedTopics(new Set());
    setLoadedLessons(new Set());
  }, []);

  // Get statistics
  const stats = useMemo(() => {
    const totalTopics = sections.reduce((sum, section) => sum + section.topics_count, 0);
    const totalLessons = sections.reduce((sum, section) => {
      if (!section.topics) return sum;
      return sum + section.topics.reduce((topicSum, topic) => topicSum + topic.lessons_count, 0);
    }, 0);

    return {
      sectionsCount: sections.length,
      topicsCount: totalTopics,
      lessonsCount: totalLessons,
      cacheStats: contentCache.getStats()
    };
  }, [sections]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  return {
    sections,
    loading,
    error,
    stats,
    loadTopicsForSection,
    loadLessonsForTopic,
    loadMediaForLesson,
    getFullLesson,
    clearCache,
    refetch: loadSections
  };
};