import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Grade11LessonMedia } from './useGrade11Content';

export const useEditLottieMedia = (onSuccess?: () => void) => {
  const updateLottieMedia = async ({
    mediaId,
    updates
  }: {
    mediaId: string;
    updates: Partial<Grade11LessonMedia>;
  }) => {
    try {
      console.log('Updating Lottie media in database:', mediaId, updates);
      
      const { error } = await supabase
        .from('grade11_lesson_media')
        .update({
          file_name: updates.file_name,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
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
        description: "تم تحديث ملف اللوتي بنجاح",
        variant: "default",
      });
      
    } catch (error) {
      logger.error('Error updating Lottie media', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث ملف اللوتي",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    updateLottieMedia,
    isUpdating: false
  };
};