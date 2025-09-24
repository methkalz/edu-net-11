import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logError, logInfo } from '@/lib/logging';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  isSupabaseReachable: boolean;
  lastError: string | null;
  retryCount: number;
}

interface NetworkError {
  type: 'fetch_failed' | 'timeout' | 'network_error' | 'auth_error';
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export const useNetworkMonitor = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    isSupabaseReachable: true,
    lastError: null,
    retryCount: 0
  });

  const [networkErrors, setNetworkErrors] = useState<NetworkError[]>([]);

  // Monitor browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true, lastError: null }));
      logInfo('Network connection restored');
      toast({
        title: "تم استعادة الاتصال",
        description: "عاد الاتصال بالإنترنت",
      });
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false, lastError: 'لا يوجد اتصال بالإنترنت' }));
      logError('Network connection lost', new Error('Browser went offline'));
      toast({
        title: "انقطع الاتصال",
        description: "تحقق من اتصالك بالإنترنت",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor connection quality
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const updateConnectionInfo = () => {
          setNetworkStatus(prev => ({
            ...prev,
            connectionType: connection.effectiveType || 'unknown'
          }));
        };

        connection.addEventListener('change', updateConnectionInfo);
        updateConnectionInfo();

        return () => {
          connection.removeEventListener('change', updateConnectionInfo);
        };
      }
    }
  }, []);

  // Test Supabase connectivity periodically
  const testSupabaseConnection = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1)
        .abortSignal(AbortSignal.timeout(10000));

      if (error && !error.message.includes('PGRST116')) {
        throw error;
      }

      setNetworkStatus(prev => ({ 
        ...prev, 
        isSupabaseReachable: true, 
        lastError: null,
        retryCount: 0 
      }));
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'فشل الاتصال بالخادم';
      setNetworkStatus(prev => ({ 
        ...prev, 
        isSupabaseReachable: false, 
        lastError: errorMessage,
        retryCount: prev.retryCount + 1
      }));
      
      logError(
        'Supabase connectivity test failed', 
        error,
        { retryCount: networkStatus.retryCount + 1 }
      );
      return false;
    }
  }, [networkStatus.retryCount]);

  // Log network errors
  const logNetworkError = useCallback((error: Omit<NetworkError, 'timestamp'>) => {
    const networkError: NetworkError = {
      ...error,
      timestamp: Date.now()
    };

    setNetworkErrors(prev => {
      const updated = [networkError, ...prev].slice(0, 50); // Keep last 50 errors
      return updated;
    });

    // Log to system
    logError(
      `Network Error: ${error.type}`,
      new Error(error.message),
      error.context
    );

    // Store in localStorage for persistence
    try {
      const storedErrors = JSON.parse(localStorage.getItem('network_errors') || '[]');
      const updatedErrors = [networkError, ...storedErrors].slice(0, 100);
      localStorage.setItem('network_errors', JSON.stringify(updatedErrors));
    } catch (storageError) {
      console.warn('Failed to store network error:', storageError);
    }
  }, []);

  // Enhanced fetch with retry and error handling
  const enhancedFetch = useCallback(async (
    url: string, 
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!networkStatus.isOnline) {
          throw new Error('لا يوجد اتصال بالإنترنت');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error: any) {
        lastError = error;
        
        const isLastAttempt = attempt === maxRetries;
        const errorType: NetworkError['type'] = 
          error.name === 'AbortError' ? 'timeout' :
          error.message.includes('fetch') ? 'fetch_failed' :
          'network_error';

        if (isLastAttempt) {
          logNetworkError({
            type: errorType,
            message: error.message,
            context: { 
              url, 
              attempt, 
              maxRetries,
              networkStatus: networkStatus.isOnline
            }
          });
        }

        // Don't retry if offline or on last attempt
        if (!networkStatus.isOnline || isLastAttempt) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }, [networkStatus.isOnline, logNetworkError]);

  // Get network error statistics
  const getErrorStats = useCallback(() => {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentErrors = networkErrors.filter(error => error.timestamp > last24Hours);
    
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: recentErrors.length,
      byType: errorsByType,
      lastError: networkErrors[0] || null
    };
  }, [networkErrors]);

  // Clear stored errors
  const clearErrors = useCallback(() => {
    setNetworkErrors([]);
    localStorage.removeItem('network_errors');
  }, []);

  // Load stored errors on mount
  useEffect(() => {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('network_errors') || '[]');
      setNetworkErrors(storedErrors);
    } catch (error) {
      console.warn('Failed to load stored network errors:', error);
    }
  }, []);

  return {
    networkStatus,
    networkErrors,
    testSupabaseConnection,
    logNetworkError,
    enhancedFetch,
    getErrorStats,
    clearErrors
  };
};