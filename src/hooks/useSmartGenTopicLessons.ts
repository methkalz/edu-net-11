import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartGenLesson {
  id: string;
  title: string;
  content: string | null;
  order_index: number;
}

export function useSmartGenTopicLessons(topicId: string | null) {
  return useQuery({
    queryKey: ['smart-gen-lessons', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      
      let data: any[] = [];
      
      const { data: lessons10 } = await supabase
        .from('grade10_lessons')
        .select('id, title, content, order_index')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (lessons10 && lessons10.length > 0) {
        data = lessons10;
      } else {
        const { data: lessons11 } = await supabase
          .from('grade11_lessons')
          .select('id, title, content, order_index')
          .eq('topic_id', topicId)
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        
        if (lessons11 && lessons11.length > 0) {
          data = lessons11;
        } else {
          const { data: lessons12 } = await (supabase as any)
            .from('grade12_lessons')
            .select('id, title, content, order_index')
            .eq('topic_id', topicId)
            .eq('is_active', true)
            .order('order_index', { ascending: true });
          
          if (lessons12) data = lessons12 || [];
        }
      }
      
      return data as SmartGenLesson[];
    },
    enabled: !!topicId
  });
}
