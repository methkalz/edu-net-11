import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface SharedLottieSettings {
  id?: string;
  enabled: boolean;
  lottie_data: any;
  speed: number;
  loop: boolean;
  file_name?: string;
}

const DEFAULT_SETTINGS: SharedLottieSettings = {
  enabled: false,
  lottie_data: null,
  speed: 1,
  loop: true,
  file_name: undefined
};

export const useSharedLottieSettings = () => {
  const queryClient = useQueryClient();

  // Fetch settings from database
  const { data: lottieSettings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['lottie-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loading_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching Lottie settings', error);
        return DEFAULT_SETTINGS;
      }

      if (!data) {
        return DEFAULT_SETTINGS;
      }

      return {
        id: data.id,
        enabled: data.enabled || false,
        lottie_data: data.lottie_data,
        speed: Number(data.speed) || 1,
        loop: data.loop !== false,
        file_name: data.file_name
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SharedLottieSettings>) => {
      // Check if user has permission (RLS will handle this, but we add client-side check for UX)
      const { data: userRole } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userRole?.role !== 'superadmin') {
        throw new Error('غير مصرح لك بتعديل إعدادات اللوتي');
      }
      const { data: existingData } = await supabase
        .from('loading_settings')
        .select('id')
        .limit(1)
        .single();

      if (existingData?.id) {
        // Update existing record
        const { error } = await supabase
          .from('loading_settings')
          .update({
            enabled: settings.enabled,
            lottie_data: settings.lottie_data,
            speed: settings.speed,
            loop: settings.loop,
            file_name: settings.file_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('loading_settings')
          .insert({
            enabled: settings.enabled || false,
            lottie_data: settings.lottie_data,
            speed: settings.speed || 1,
            loop: settings.loop !== false,
            file_name: settings.file_name
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lottie-settings'] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات Lottie بنجاح وستظهر لجميع المستخدمين",
      });
    },
    onError: (error) => {
      logger.error('Error saving Lottie settings', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات Lottie",
        variant: "destructive",
      });
    }
  });

  const saveLottieSettings = (settings: Partial<SharedLottieSettings>) => {
    saveSettingsMutation.mutate(settings);
  };

  return {
    lottieSettings,
    saveLottieSettings,
    isLoading,
    isSaving: saveSettingsMutation.isPending
  };
};