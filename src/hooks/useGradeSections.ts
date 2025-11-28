import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GradeSection {
  id: string;
  title: string;
  order_index: number;
}

/**
 * Hook لجلب الأقسام (Sections) بناءً على الصف
 */
export function useGradeSections(gradeLevel: string | null) {
  return useQuery({
    queryKey: ['grade-sections', gradeLevel],
    queryFn: async () => {
      if (!gradeLevel) return [];
      
      let data: any[] = [];
      
      if (gradeLevel === '10') {
        const { data: sections, error } = await supabase
          .from('grade10_sections')
          .select('id, title, order_index')
          .order('order_index', { ascending: true });
        if (error) throw error;
        data = sections || [];
      } else if (gradeLevel === '11') {
        const { data: sections, error } = await supabase
          .from('grade11_sections')
          .select('id, title, order_index')
          .order('order_index', { ascending: true });
        if (error) throw error;
        data = sections || [];
      } else if (gradeLevel === '12') {
        const { data: sections, error } = await (supabase as any)
          .from('grade12_sections')
          .select('id, title, order_index')
          .order('order_index', { ascending: true });
        if (error) throw error;
        data = sections || [];
      }
      
      return data as GradeSection[];
    },
    enabled: !!gradeLevel
  });
}
