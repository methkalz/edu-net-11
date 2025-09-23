import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarAssignmentResult {
  updated_count: number;
  message: string;
  updates?: Array<{
    user_id: string;
    role: string;
    new_avatar: string;
  }>;
}

export const useAvatarAssignment = () => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [lastResult, setLastResult] = useState<AvatarAssignmentResult | null>(null);
  const { toast } = useToast();

  const assignRandomAvatars = useCallback(async () => {
    try {
      setIsAssigning(true);
      
      // استدعاء Edge Function لتعيين أفاتار عشوائي للمستخدمين
      const { data, error } = await supabase.functions.invoke('assign-random-avatars');
      
      if (error) {
        throw error;
      }

      setLastResult(data);
      
      toast({
        title: 'تم بنجاح',
        description: data.message,
        variant: 'default'
      });

      return data;
      
    } catch (error) {
      console.error('Error assigning avatars:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تعيين الأفاتار العشوائية',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsAssigning(false);
    }
  }, [toast]);

  // دالة لجلب أفاتار عشوائي لدور معين
  const getRandomAvatarForRole = useCallback(async (role: string): Promise<string> => {
    try {
      const { data: avatars, error } = await supabase
        .from('avatar_images')
        .select('file_path')
        .eq('is_active', true)
        .or(`category.eq.${role},category.eq.universal`);
      
      if (error) throw error;
      
      if (!avatars || avatars.length === 0) {
        return '/avatars/universal-default.png';
      }
      
      // اختيار عشوائي
      const randomIndex = Math.floor(Math.random() * avatars.length);
      return avatars[randomIndex].file_path;
      
    } catch (error) {
      console.error('Error getting random avatar:', error);
      return '/avatars/universal-default.png';
    }
  }, []);

  // دالة لتعيين أفاتار عشوائي لمستخدم واحد
  const assignAvatarToUser = useCallback(async (userId: string, role: string) => {
    try {
      const randomAvatar = await getRandomAvatarForRole(role);
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: randomAvatar })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return randomAvatar;
      
    } catch (error) {
      console.error('Error assigning avatar to user:', error);
      throw error;
    }
  }, [getRandomAvatarForRole]);

  return {
    isAssigning,
    lastResult,
    assignRandomAvatars,
    getRandomAvatarForRole,
    assignAvatarToUser
  };
};