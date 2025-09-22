import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface LottieSettings {
  enabled: boolean;
  animationData: any;
  speed: number;
  loop: boolean;
  fileName?: string;
}

const DEFAULT_LOTTIE_SETTINGS: LottieSettings = {
  enabled: false,
  animationData: null,
  speed: 1,
  loop: true,
  fileName: undefined
};

export const useLottieSettings = () => {
  const [lottieSettings, setLottieSettings] = useState<LottieSettings>(DEFAULT_LOTTIE_SETTINGS);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('lottie_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setLottieSettings(parsed);
    } catch (error) {
      logger.error('Error parsing Lottie settings', error as Error);
      }
    }
  }, []);

  const updateLottieSettings = (newSettings: Partial<LottieSettings>) => {
    const updated = { ...lottieSettings, ...newSettings };
    setLottieSettings(updated);
    setUnsavedChanges(true);
  };

  const saveLottieSettings = () => {
    localStorage.setItem('lottie_settings', JSON.stringify(lottieSettings));
    setUnsavedChanges(false);
  };

  const resetLottieSettings = () => {
    setLottieSettings(DEFAULT_LOTTIE_SETTINGS);
    localStorage.removeItem('lottie_settings');
    setUnsavedChanges(false);
  };

  return {
    lottieSettings,
    updateLottieSettings,
    saveLottieSettings,
    resetLottieSettings,
    unsavedChanges
  };
};