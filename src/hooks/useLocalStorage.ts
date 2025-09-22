/**
 * Local Storage Hook
 * 
 * A powerful React hook for managing localStorage with TypeScript support.
 * Provides automatic serialization, error handling, and cross-tab synchronization.
 * 
 * Features:
 * - Type-safe localStorage operations
 * - Automatic JSON serialization/deserialization
 * - Custom serializer support for complex data types
 * - Error handling with logging
 * - Cross-tab synchronization via storage events
 * - Functional updates support
 * - Easy removal of stored values
 * 
 * @example
 * // Basic usage with default JSON serialization
 * const [user, setUser, removeUser] = useLocalStorage('user', {
 *   defaultValue: null
 * });
 * 
 * // With custom serializer
 * const [date, setDate] = useLocalStorage('lastLogin', {
 *   defaultValue: new Date(),
 *   serializer: {
 *     parse: (value) => new Date(value),
 *     stringify: (value) => value.toISOString()
 *   }
 * });
 * 
 * // Functional updates
 * setUser(prevUser => ({ ...prevUser, name: 'Updated' }));
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Local Storage Hook Options Interface
 * 
 * Configuration options for the useLocalStorage hook.
 */
export interface LocalStorageHookOptions<T> {
  /** Default value to use when localStorage is empty or invalid */
  defaultValue: T;
  /** Custom serializer for complex data types (defaults to JSON) */
  serializer?: {
    /** Function to parse stored string back to type T */
    parse: (value: string) => T;
    /** Function to convert type T to string for storage */
    stringify: (value: T) => string;
  };
}

/**
 * useLocalStorage Hook Implementation
 * 
 * @param key - The localStorage key to use
 * @param options - Configuration options including default value and serializer
 * @returns Tuple of [value, setValue, removeValue] similar to useState
 */
export const useLocalStorage = <T>(
  key: string,
  options: LocalStorageHookOptions<T>
) => {
  const { defaultValue, serializer = JSON } = options;

  // Initialize state with value from localStorage or default value
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? serializer.parse(item) : defaultValue;
    } catch (error) {
      logger.warn(`Error reading localStorage key "${key}"`, { key, error });
      return defaultValue;
    }
  });

  /**
   * Update stored value with support for functional updates
   * 
   * Similar to React's useState setter, accepts either a new value
   * or a function that receives the previous value and returns the new one.
   */
  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, serializer.stringify(valueToStore));
    } catch (error) {
      logger.warn(`Error setting localStorage key "${key}"`, { key, newValue, error });
    }
  }, [key, serializer, value]);

  /**
   * Remove value from localStorage and reset to default
   * 
   * Clears the stored value and resets the state to the default value.
   */
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      logger.warn(`Error removing localStorage key "${key}"`, { key, error });
    }
  }, [key, defaultValue]);

  // Cross-tab synchronization listener
  // Listen for changes from other tabs/windows and update local state
  useEffect(() => {
    /**
     * Handle storage changes from other tabs/windows
     * 
     * When another tab updates the same localStorage key,
     * this listener will update the local state accordingly.
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(serializer.parse(e.newValue));
        } catch (error) {
          logger.warn(`Error parsing localStorage change for key "${key}"`, { key, newValue: e.newValue, error });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, serializer]);

  // Return tuple similar to useState, with additional removeValue function
  return [value, setStoredValue, removeValue] as const;
};