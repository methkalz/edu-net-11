import { useState, useEffect, useMemo, useCallback } from 'react';
import { Grade11SectionWithTopics, Grade11TopicWithLessons, Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import { logger } from '@/lib/logger';

interface UseVirtualizedContentProps {
  sections: Grade11SectionWithTopics[];
  searchTerm: string;
  itemHeight?: number;
  windowHeight?: number;
}

interface VirtualizedItem {
  id: string;
  type: 'section' | 'topic' | 'lesson';
  data: any;
  level: number;
  parentId?: string;
}

export const useVirtualizedContent = ({
  sections,
  searchTerm,
  itemHeight = 120,
  windowHeight = 800
}: UseVirtualizedContentProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);

  // مؤشرات الأداء
  const [renderTime, setRenderTime] = useState(0);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);

  // إنشاء قائمة مسطحة للعناصر المرئية
  const flattenedItems = useMemo(() => {
    const startTime = performance.now();
    const items: VirtualizedItem[] = [];

    sections.forEach(section => {
      // فلترة حسب البحث
      const matchesSearch = !searchTerm || 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.topics.some(topic => 
          topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.lessons.some(lesson => 
            lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

      if (!matchesSearch) return;

      // إضافة القسم
      items.push({
        id: section.id,
        type: 'section',
        data: section,
        level: 0
      });

      // إضافة المواضيع إذا كان القسم مفتوحاً
      if (expandedSections.has(section.id)) {
        section.topics.forEach(topic => {
          items.push({
            id: topic.id,
            type: 'topic',
            data: topic,
            level: 1,
            parentId: section.id
          });

          // إضافة الدروس إذا كان الموضوع مفتوحاً
          if (expandedTopics.has(topic.id)) {
            topic.lessons.forEach(lesson => {
              items.push({
                id: lesson.id,
                type: 'lesson',
                data: lesson,
                level: 2,
                parentId: topic.id
              });
            });
          }
        });
      }
    });

    const endTime = performance.now();
    setRenderTime(endTime - startTime);
    
    logger.debug('Virtualized content flattened', {
      totalItems: items.length,
      renderTime: endTime - startTime,
      searchTerm
    });

    return items;
  }, [sections, searchTerm, expandedSections, expandedTopics]);

  // حساب العناصر المرئية
  const visibleItems = useMemo(() => {
    const containerHeight = windowHeight || 800;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2,
      flattenedItems.length
    );

    const visible = flattenedItems.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight
    }));

    setVisibleItemsCount(visible.length);
    return visible;
  }, [flattenedItems, scrollTop, itemHeight, windowHeight]);

  // تبديل حالة التوسيع
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
        // إغلاق جميع المواضيع في هذا القسم
        const section = sections.find(s => s.id === sectionId);
        section?.topics.forEach(topic => {
          setExpandedTopics(prev => {
            const newTopicSet = new Set(prev);
            newTopicSet.delete(topic.id);
            return newTopicSet;
          });
        });
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, [sections]);

  const toggleTopic = useCallback((topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  }, []);

  // إحصائيات الأداء
  const stats = useMemo(() => {
    const allTopics = sections.flatMap(s => s.topics);
    const allLessons = allTopics.flatMap(t => t.lessons);
    
    return {
      totalSections: sections.length,
      totalTopics: allTopics.length,
      totalLessons: allLessons.length,
      expandedSections: expandedSections.size,
      expandedTopics: expandedTopics.size,
      visibleItems: visibleItemsCount,
      renderTime,
      virtualizedItemsCount: flattenedItems.length
    };
  }, [sections, expandedSections, expandedTopics, visibleItemsCount, renderTime, flattenedItems.length]);

  return {
    visibleItems,
    flattenedItems,
    totalHeight: flattenedItems.length * itemHeight,
    expandedSections,
    expandedTopics,
    toggleSection,
    toggleTopic,
    setScrollTop,
    stats
  };
};