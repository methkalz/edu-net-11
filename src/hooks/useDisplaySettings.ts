import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export interface DisplaySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

const defaultSettings: DisplaySettings = {
  fontSize: 'medium'
};

export const useDisplaySettings = () => {
  const [settings, setSettings] = useState<DisplaySettings>(defaultSettings);
  const { theme, setTheme, systemTheme } = useTheme();

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('display_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading display settings:', error);
    }
  }, []);

  // Apply font size to document
  useEffect(() => {
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px', 
      'large': '18px',
      'extra-large': '20px'
    };

    document.documentElement.style.setProperty('--app-font-size', fontSizeMap[settings.fontSize]);
    document.documentElement.style.setProperty('--app-font-scale', 
      settings.fontSize === 'small' ? '0.875' :
      settings.fontSize === 'medium' ? '1' :
      settings.fontSize === 'large' ? '1.125' : '1.25'
    );
  }, [settings.fontSize]);

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem('display_settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving display settings:', error);
    }
  };

  const increaseFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      updateSettings({ fontSize: sizes[currentIndex + 1] });
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSettings({ fontSize: sizes[currentIndex - 1] });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';

  return {
    settings,
    updateSettings,
    increaseFontSize,
    decreaseFontSize,
    toggleTheme,
    isDarkMode,
    theme: currentTheme
  };
};