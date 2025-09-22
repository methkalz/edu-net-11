import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserAvatar = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const updateAvatar = useCallback(async (avatarUrl: string, userId?: string) => {
    try {
      setUpdating(true);
      
      // Get current user ID if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', targetUserId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث صورة البروفايل',
        variant: 'destructive'
      });
      return { success: false, error };
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  const getAvatarsByRole = useCallback(async (role: string) => {
    try {
      const { data, error } = await supabase
        .from('avatar_images')
        .select('*')
        .eq('is_active', true)
        .or(`category.eq.${role},category.eq.universal`)
        .order('order_index');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching avatars:', error);
      return [];
    }
  }, []);

  return {
    updateAvatar,
    getAvatarsByRole,
    updating
  };
};