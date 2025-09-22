import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/lib/logger';

interface LoadingStates {
  [key: string]: boolean;
}

interface ErrorStates {
  [key: string]: string | null;
}

export const useAsyncOperation = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const [errorStates, setErrorStates] = useState<ErrorStates>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setErrorStates(prev => ({ ...prev, [key]: error }));
  }, []);

  const isLoading = useCallback((key: string) => loadingStates[key] || false, [loadingStates]);
  const getError = useCallback((key: string) => errorStates[key] || null, [errorStates]);

  const executeAsync = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      skipLoading?: boolean;
    }
  ): Promise<T | null> => {
    try {
      if (!options?.skipLoading) {
        setLoading(key, true);
      }
      setError(key, null);

      const result = await operation();
      
      options?.onSuccess?.(result);
      logInfo(`Operation ${key} completed successfully`);
      
      return result;
    } catch (err) {
      const error = err as Error;
      logError(`Operation ${key} failed`, error);
      setError(key, error.message);
      options?.onError?.(error);
      return null;
    } finally {
      if (!options?.skipLoading) {
        setLoading(key, false);
      }
    }
  }, [setLoading, setError]);

  const clearState = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setErrorStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  return {
    executeAsync,
    isLoading,
    getError,
    setLoading,
    setError,
    clearState,
    loadingStates,
    errorStates
  };
};