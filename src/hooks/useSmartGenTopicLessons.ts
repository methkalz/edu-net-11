import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartGenLesson {
  id: string;
  title: string;
  content: string | null;
  order_index: number;
}

export function useSmartGenTopicLessons(topicIds: string[]) {
  return useQuery({
    queryKey: ['smart-gen-lessons', topicIds],
    queryFn: async () => {
      if (topicIds.length === 0) return [];
      
      // فلترة 'all' من القائمة
      const actualTopicIds = topicIds.filter(id => id !== 'all');
      if (actualTopicIds.length === 0) return [];
      
      let allLessons: SmartGenLesson[] = [];
      
      // جلب دروس جميع المواضيع المختارة
      for (const topicId of actualTopicIds) {
        // محاولة جلب من grade10
        const { data: lessons10 } = await supabase
          .from('grade10_lessons')
          .select('id, title, content, order_index')
          .eq('topic_id', topicId)
          .eq('is_active', true);
        
        if (lessons10 && lessons10.length > 0) {
          allLessons = [...allLessons, ...lessons10];
          continue;
        }
        
        // محاولة جلب من grade11
        const { data: lessons11 } = await supabase
          .from('grade11_lessons')
          .select('id, title, content, order_index')
          .eq('topic_id', topicId)
          .eq('is_active', true);
        
        if (lessons11 && lessons11.length > 0) {
          allLessons = [...allLessons, ...lessons11];
          continue;
        }
        
        // محاولة جلب من grade12
        const { data: lessons12 } = await (supabase as any)
          .from('grade12_lessons')
          .select('id, title, content, order_index')
          .eq('topic_id', topicId)
          .eq('is_active', true);
        
        if (lessons12 && lessons12.length > 0) {
          allLessons = [...allLessons, ...lessons12];
        }
      }
      
      // ترتيب حسب order_index
      return allLessons.sort((a, b) => a.order_index - b.order_index);
    },
    enabled: topicIds.length > 0 && topicIds.some(id => id !== 'all')
  });
}
