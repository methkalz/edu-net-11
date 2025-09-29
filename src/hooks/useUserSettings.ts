import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface UserSettings {
  theme: Theme;
  fontSize: FontSize;
}

export const useUserSettings = () => {
  const [isLoading, setIsLoading] = useState(false);

  // تحميل إعدادات المستخدم من قاعدة البيانات
  const loadUserSettings = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('theme, font_size')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading user settings:', error);
        return { theme: 'light' as Theme, fontSize: 'medium' as FontSize };
      }

      const settings: UserSettings = {
        theme: (profile?.theme as Theme) || 'light',
        fontSize: (profile?.font_size as FontSize) || 'medium'
      };

      // تطبيق الإعدادات على localStorage
      localStorage.setItem('theme', settings.theme);
      localStorage.setItem('display-settings', JSON.stringify({ fontSize: settings.fontSize }));

      return settings;
    } catch (error) {
      console.error('Error in loadUserSettings:', error);
      return { theme: 'light' as Theme, fontSize: 'medium' as FontSize };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // حفظ الثيم في قاعدة البيانات
  const saveTheme = useCallback(async (userId: string, theme: Theme) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving theme:', error);
        toast.error('فشل في حفظ إعدادات الثيم');
        return false;
      }

      // حفظ في localStorage أيضاً للاستخدام الفوري
      localStorage.setItem('theme', theme);
      return true;
    } catch (error) {
      console.error('Error in saveTheme:', error);
      toast.error('فشل في حفظ إعدادات الثيم');
      return false;
    }
  }, []);

  // حفظ حجم الخط في قاعدة البيانات
  const saveFontSize = useCallback(async (userId: string, fontSize: FontSize) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ font_size: fontSize })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving font size:', error);
        toast.error('فشل في حفظ إعدادات حجم الخط');
        return false;
      }

      // حفظ في localStorage أيضاً للاستخدام الفوري
      const displaySettings = { fontSize };
      localStorage.setItem('display-settings', JSON.stringify(displaySettings));
      return true;
    } catch (error) {
      console.error('Error in saveFontSize:', error);
      toast.error('فشل في حفظ إعدادات حجم الخط');
      return false;
    }
  }, []);

  // إعادة تعيين الإعدادات للقيم الافتراضية
  const resetToDefaults = useCallback(() => {
    // مسح localStorage
    localStorage.removeItem('theme');
    localStorage.removeItem('display-settings');
    
    // تعيين القيم الافتراضية في localStorage
    localStorage.setItem('theme', 'light');
    localStorage.setItem('display-settings', JSON.stringify({ fontSize: 'medium' }));
  }, []);

  // تحديث إعدادات المستخدم (ثيم + حجم خط معاً)
  const updateUserSettings = useCallback(async (userId: string, settings: Partial<UserSettings>) => {
    try {
      const updateData: any = {};
      
      if (settings.theme !== undefined) {
        updateData.theme = settings.theme;
      }
      
      if (settings.fontSize !== undefined) {
        updateData.font_size = settings.fontSize;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user settings:', error);
        toast.error('فشل في حفظ الإعدادات');
        return false;
      }

      // تحديث localStorage
      if (settings.theme !== undefined) {
        localStorage.setItem('theme', settings.theme);
      }
      
      if (settings.fontSize !== undefined) {
        localStorage.setItem('display-settings', JSON.stringify({ fontSize: settings.fontSize }));
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserSettings:', error);
      toast.error('فشل في حفظ الإعدادات');
      return false;
    }
  }, []);

  return {
    isLoading,
    loadUserSettings,
    saveTheme,
    saveFontSize,
    updateUserSettings,
    resetToDefaults
  };
};