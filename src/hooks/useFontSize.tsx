/**
 * Font Size Management Hook
 * 
 * Hook for managing application-wide font size scaling.
 * Supports four font size levels: small (90%), normal (100%), large (110%), and xlarge (120%).
 * 
 * Features:
 * - Persistent font size preference in localStorage
 * - Dynamic CSS variable updates
 * - Keyboard-friendly increase/decrease functions
 * - Type-safe font size values
 * 
 * @example
 * const { fontSize, setFontSize, increaseFontSize, decreaseFontSize } = useFontSize();
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type FontSize = 'small' | 'normal' | 'large' | 'xlarge';

interface FontSizeConfig {
  label: string;
  scale: number;
}

const FONT_SIZE_CONFIG: Record<FontSize, FontSizeConfig> = {
  small: { label: 'صغير', scale: 0.9 },
  normal: { label: 'عادي', scale: 1.0 },
  large: { label: 'كبير', scale: 1.1 },
  xlarge: { label: 'كبير جداً', scale: 1.2 },
};

const FONT_SIZE_ORDER: FontSize[] = ['small', 'normal', 'large', 'xlarge'];

export const useFontSize = () => {
  const [fontSize, setFontSize] = useLocalStorage<FontSize>('font-size', {
    defaultValue: 'normal',
  });

  // Apply font size to document root
  const applyFontSize = useCallback((size: FontSize) => {
    const scale = FONT_SIZE_CONFIG[size].scale;
    document.documentElement.style.setProperty('--font-scale', scale.toString());
  }, []);

  // Apply font size on mount and when it changes
  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize, applyFontSize]);

  // Increase font size to next level
  const increaseFontSize = useCallback(() => {
    const currentIndex = FONT_SIZE_ORDER.indexOf(fontSize);
    if (currentIndex < FONT_SIZE_ORDER.length - 1) {
      setFontSize(FONT_SIZE_ORDER[currentIndex + 1]);
    }
  }, [fontSize, setFontSize]);

  // Decrease font size to previous level
  const decreaseFontSize = useCallback(() => {
    const currentIndex = FONT_SIZE_ORDER.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(FONT_SIZE_ORDER[currentIndex - 1]);
    }
  }, [fontSize, setFontSize]);

  return {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    fontSizeConfig: FONT_SIZE_CONFIG,
    canIncrease: fontSize !== 'xlarge',
    canDecrease: fontSize !== 'small',
  };
};
