import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SectionTopic {
  id: string;
  title: string;
  order_index: number;
}

/**
 * Hook لجلب المواضيع (Topics) بناءً على القسم
 */
export function useSectionTopics(gradeLevel: string | null, sectionId: string | null) {
  return useQuery({
    queryKey: ['section-topics', gradeLevel, sectionId],
    queryFn: async () => {
      if (!gradeLevel || !sectionId) return [];
      
      let data: any[] = [];
      
      if (gradeLevel === '10') {
        const { data: topics, error } = await supabase
          .from('grade10_topics')
          .select('id, title, order_index')
          .eq('section_id', sectionId)
          .order('order_index', { ascending: true });
        if (error) throw error;
        data = topics || [];
      } else if (gradeLevel === '11') {
        const { data: topics, error } = await supabase
          .from('grade11_topics')
          .select('id, title, order_index')
          .eq('section_id', sectionId)
          .order('order_index', { ascending: true });
        if (error) throw error;
        data = topics || [];
      } else if (gradeLevel === '12') {
        const { data: topics, error } = await (supabase as any)
          .from('grade12_topics')
          .select('id, title, order_index')
          .eq('section_id', sectionId)
          .order('order_index', { ascending: true});
        if (error) throw error;
        data = topics || [];
      }
      
      return data as SectionTopic[];
    },
    enabled: !!gradeLevel && !!sectionId
  });
}
