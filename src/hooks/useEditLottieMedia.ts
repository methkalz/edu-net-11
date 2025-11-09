import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Grade11LessonMedia } from './useGrade11Content';

export const useEditLottieMedia = (onSuccess?: () => void, tableName: 'grade11_lesson_media' | 'grade10_lesson_media' = 'grade11_lesson_media') => {
  const updateLottieMedia = async ({
    mediaId,
    updates
  }: {
    mediaId: string;
    updates: Partial<Grade11LessonMedia>;
  }) => {
    try {
      console.log(`Updating Lottie media in ${tableName}:`, mediaId, updates);
      
      const { error } = await supabase
        .from(tableName)
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