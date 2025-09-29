import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useUserSettings } from './useUserSettings';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface DisplaySettings {
  fontSize: FontSize;
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  'small': '14px',
  'medium': '16px',
  'large': '18px',
  'extra-large': '20px'
};

const FONT_SIZE_SCALE: Record<FontSize, string> = {
  'small': '0.875',
  'medium': '1',
  'large': '1.125',
  'extra-large': '1.25'
};

export const useDisplaySettings = (userId?: string | null) => {
  const { theme, setTheme } = useTheme();
  const { saveFontSize, saveTheme } = useUserSettings();
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('display-settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { fontSize: 'medium' };
        }
      }
    }
    return { fontSize: 'medium' };
  });

  // Apply CSS variables when settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-font-size', FONT_SIZE_MAP[settings.fontSize]);
    root.style.setProperty('--app-font-scale', FONT_SIZE_SCALE[settings.fontSize]);
  }, [settings.fontSize]);

  // Save to localStorage when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('display-settings', JSON.stringify(settings));
    }
  }, [settings]);

  const updateFontSize = async (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
    
    // حفظ في قاعدة البيانات إذا كان المستخدم مسجل دخول
    if (userId) {
      await saveFontSize(userId, fontSize);
    }
  };

  const increaseFontSize = () => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      updateFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateFontSize(sizes[currentIndex - 1]);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // حفظ في قاعدة البيانات إذا كان المستخدم مسجل دخول
    if (userId) {
      await saveTheme(userId, newTheme as 'light' | 'dark');
    }
  };

  // دالة مساعدة لتحديث الثيم مع الحفظ في قاعدة البيانات
  const updateTheme = async (newTheme: string) => {
    setTheme(newTheme);
    
    // حفظ في قاعدة البيانات إذا كان المستخدم مسجل دخول
    if (userId && (newTheme === 'light' || newTheme === 'dark')) {
      await saveTheme(userId, newTheme);
    }
  };

  return {
    fontSize: settings.fontSize,
    theme,
    updateFontSize,
    increaseFontSize,
    decreaseFontSize,
    toggleTheme,
    setTheme: updateTheme
  };
};