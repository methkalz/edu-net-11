import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

// نقاط ثابتة لكل نوع محتوى
const POINTS = {
  LESSON: 2,      // كل درس = 2 نقطة
  VIDEO: 20,      // كل فيديو = 20 نقطة
  GAME_STAGE: 10  // كل مرحلة لعبة = 10 نقاط
};

export const useGrade11Points = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // إضافة نقاط للملف الشخصي
  const addPointsToProfile = useCallback(async (points: number) => {
    if (!user || points <= 0) return false;

    try {
      // الحصول على الملف الشخصي الحالي
      const { data: profile, error: fetchError } = await supabase
        .from('grade11_player_profiles')
        .select('total_xp, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!profile) return false;

      const newTotalXP = profile.total_xp + points;
      const newLevel = Math.floor(newTotalXP / 100) + 1; // كل 100 نقطة = مستوى جديد

      const updateData: any = { total_xp: newTotalXP };
      
      // تحديث المستوى إذا تغير
      if (newLevel > profile.level) {
        updateData.level = newLevel;
        
        toast({
          title: `🎉 مستوى جديد!`,
          description: `تهانينا! وصلت للمستوى ${newLevel}!`,
          duration: 6000
        });
      }

      const { error: updateError } = await supabase
        .from('grade11_player_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      logger.info('Points added to profile', { 
        userId: user.id, 
        points, 
        newTotalXP, 
        newLevel 
      });
      
      return true;
    } catch (error) {
      logger.error('Error adding points to profile', error);
      return false;
    }
  }, [user, toast]);

  // إضافة نقاط لدرس مكتمل
  const addLessonPoints = useCallback(async (lessonId: string) => {
    if (!user) return false;

    try {
      // التحقق من عدم وجود نقاط سابقة لهذا الدرس
      const { data: existingProgress } = await supabase
        .from('grade11_game_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      // إذا كانت النقاط موجودة بالفعل، لا نضيف مرة أخرى
      if (existingProgress && (existingProgress as any).points_earned > 0) {
        return false;
      }

      // إضافة النقاط
      const success = await addPointsToProfile(POINTS.LESSON);
      
      if (success) {
        // تحديث سجل التقدم
        await supabase
          .from('grade11_game_progress')
          .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            points_earned: POINTS.LESSON,
            completed_at: new Date().toISOString()
          } as any, {
            onConflict: 'user_id,lesson_id'
          });

        toast({
          title: '✨ حصلت على نقاط!',
          description: `+${POINTS.LESSON} نقطة لإكمال الدرس`,
          duration: 3000
        });
      }

      return success;
    } catch (error) {
      logger.error('Error adding lesson points', error);
      return false;
    }
  }, [user, addPointsToProfile, toast]);

  // إضافة نقاط لفيديو مكتمل
  const addVideoPoints = useCallback(async (videoId: string) => {
    if (!user) return false;

    try {
      // التحقق من عدم وجود نقاط سابقة لهذا الفيديو
      const { data: existingProgress } = await supabase
        .from('student_progress')
        .select('points_earned')
        .eq('student_id', user.id)
        .eq('content_id', videoId)
        .eq('content_type', 'video')
        .maybeSingle();

      // إذا كانت النقاط موجودة بالفعل، لا نضيف مرة أخرى
      if (existingProgress && existingProgress.points_earned >= POINTS.VIDEO) {
        return false;
      }

      // إضافة النقاط
      const success = await addPointsToProfile(POINTS.VIDEO);
      
      if (success) {
        toast({
          title: '✨ حصلت على نقاط!',
          description: `+${POINTS.VIDEO} نقطة لإكمال الفيديو`,
          duration: 3000
        });
      }

      return success;
    } catch (error) {
      logger.error('Error adding video points', error);
      return false;
    }
  }, [user, addPointsToProfile, toast]);

  // إضافة نقاط لمرحلة لعبة مكتملة
  const addGameStagePoints = useCallback(async (gameId: string) => {
    if (!user) return false;

    try {
      // التحقق من عدم وجود نقاط سابقة لهذه المرحلة
      const { data: existingProgress } = await supabase
        .from('player_game_progress')
        .select('*')
        .eq('player_id', user.id)
        .eq('game_id', gameId)
        .maybeSingle();

      // إذا كانت النقاط موجودة بالفعل، لا نضيف مرة أخرى
      if (existingProgress && (existingProgress as any).points_earned > 0) {
        return false;
      }

      // إضافة النقاط
      const success = await addPointsToProfile(POINTS.GAME_STAGE);
      
      if (success) {
        // تحديث سجل التقدم
        await supabase
          .from('player_game_progress')
          .update({
            points_earned: POINTS.GAME_STAGE
          } as any)
          .eq('player_id', user.id)
          .eq('game_id', gameId);

        toast({
          title: '✨ حصلت على نقاط!',
          description: `+${POINTS.GAME_STAGE} نقطة لإكمال المرحلة`,
          duration: 3000
        });
      }

      return success;
    } catch (error) {
      logger.error('Error adding game stage points', error);
      return false;
    }
  }, [user, addPointsToProfile, toast]);

  return {
    addLessonPoints,
    addVideoPoints,
    addGameStagePoints,
    POINTS
  };
};
