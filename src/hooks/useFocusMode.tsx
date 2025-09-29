/**
 * Focus Mode Hook
 * 
 * Hook for managing focus mode with grayscale and dimming effects.
 * Helps users concentrate by reducing visual distractions.
 * 
 * @author Educational Platform Team
 */

import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useFocusMode = () => {
  const [focusMode, setFocusMode] = useLocalStorage<boolean>('focus-mode', {
    defaultValue: false,
  });

  // Apply focus mode class to document root
  const applyFocusMode = useCallback((enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  }, []);

  // Apply on mount and when it changes
  useEffect(() => {
    applyFocusMode(focusMode);
  }, [focusMode, applyFocusMode]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(!focusMode);
  }, [focusMode, setFocusMode]);

  return {
    focusMode,
    setFocusMode,
    toggleFocusMode,
  };
};
