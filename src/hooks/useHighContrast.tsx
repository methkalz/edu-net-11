/**
 * High Contrast Mode Hook
 * 
 * Hook for managing high contrast accessibility mode.
 * Applies high contrast color scheme for better visibility.
 * 
 * @author Educational Platform Team
 */

import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useHighContrast = () => {
  const [highContrast, setHighContrast] = useLocalStorage<boolean>('high-contrast', {
    defaultValue: false,
  });

  // Apply high contrast class to document root
  const applyHighContrast = useCallback((enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, []);

  // Apply on mount and when it changes
  useEffect(() => {
    applyHighContrast(highContrast);
  }, [highContrast, applyHighContrast]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(!highContrast);
  }, [highContrast, setHighContrast]);

  return {
    highContrast,
    setHighContrast,
    toggleHighContrast,
  };
};
