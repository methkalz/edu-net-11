/**
 * Reduce Motion Hook
 * 
 * Hook for managing reduced motion preference.
 * Disables animations and transitions for accessibility.
 * 
 * @author Educational Platform Team
 */

import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useLocalStorage<boolean>('reduce-motion', {
    defaultValue: false,
  });

  // Apply reduce motion class to document root
  const applyReduceMotion = useCallback((enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, []);

  // Apply on mount and when it changes
  useEffect(() => {
    applyReduceMotion(reduceMotion);
  }, [reduceMotion, applyReduceMotion]);

  const toggleReduceMotion = useCallback(() => {
    setReduceMotion(!reduceMotion);
  }, [reduceMotion, setReduceMotion]);

  return {
    reduceMotion,
    setReduceMotion,
    toggleReduceMotion,
  };
};
