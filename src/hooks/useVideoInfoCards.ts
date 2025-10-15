import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

export interface VideoInfoCard {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useVideoInfoCards = (gradeLevel: string = '11') => {
  const [cards, setCards] = useState<VideoInfoCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grade11_video_info_cards')
        .select('*')
        .eq('grade_level', gradeLevel)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      logger.error('Error fetching video info cards', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل البطاقات المعلوماتية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (cardData: Omit<VideoInfoCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade11_video_info_cards')
        .insert([cardData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'نجح',
        description: 'تم إضافة البطاقة بنجاح'
      });

      await fetchCards();
      return data;
    } catch (error) {
      logger.error('Error adding video info card', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل إضافة البطاقة',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateCard = async (id: string, updates: Partial<VideoInfoCard>) => {
    try {
      const { error } = await supabase
        .from('grade11_video_info_cards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'نجح',
        description: 'تم تحديث البطاقة بنجاح'
      });

      await fetchCards();
    } catch (error) {
      logger.error('Error updating video info card', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث البطاقة',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade11_video_info_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'نجح',
        description: 'تم حذف البطاقة بنجاح'
      });

      await fetchCards();
    } catch (error) {
      logger.error('Error deleting video info card', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف البطاقة',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCards();
  }, [gradeLevel]);

  return {
    cards,
    loading,
    addCard,
    updateCard,
    deleteCard,
    refetch: fetchCards
  };
};