import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Grade11LessonMedia } from './useGrade11Content';

export const useEditCodeMedia = (onSuccess?: () => void) => {
  const updateCodeMedia = async ({
    mediaId,
    updates
  }: {
    mediaId: string;
    updates: Partial<Grade11LessonMedia>;
  }) => {
    try {
      console.log('Updating Code media in database:', mediaId, updates);
      
      const { error } = await supabase
        .from('grade11_lesson_media')
        .update({
          file_name: updates.file_name,
          metadata: updates.metadata
        })
        .eq('id', mediaId);

      if (error) throw error;

      console.log('Database update successful');
      
      // Call success callback to refresh local data
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث ملف الكود بنجاح",
        variant: "default",
      });
      
    } catch (error) {
      logger.error('Error updating Code media', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث ملف الكود",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    updateCodeMedia,
    isUpdating: false
  };
};