import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNetworkMonitor } from './useNetworkMonitor';
import { useErrorHandler } from '@/lib/error-handling';
import { logError, logInfo } from '@/lib/logging';

interface AuthError {
  type: 'network' | 'auth' | 'server' | 'timeout' | 'unknown';
  message: string;
  originalError?: any;
}

interface EnhancedAuthOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

export const useEnhancedAuth = (options: EnhancedAuthOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeoutMs = 15000
  } = options;

  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { networkStatus, logNetworkError } = useNetworkMonitor();
  const { handleError } = useErrorHandler();

  const classifyError = (error: any): AuthError => {
    const errorMessage = error?.message || 'حدث خطأ غير محدد';
    
    // Network-related errors
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('ERR_NETWORK') ||
      error?.name === 'TypeError' && errorMessage.includes('fetch')
    ) {
      return {
        type: 'network',
        message: 'فشل الاتصال بالخادم - تحقق من اتصالك بالإنترنت',
        originalError: error
      };
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('AbortError') ||
      error?.name === 'AbortError'
    ) {
      return {
        type: 'timeout',
        message: 'انتهت مهلة الاتصال - الشبكة بطيئة أو الخادم مشغول',
        originalError: error
      };
    }

    // Authentication errors
    if (
      errorMessage.includes('Invalid login credentials') ||
      errorMessage.includes('Email not confirmed') ||
      errorMessage.includes('Invalid credentials') ||
      error?.status === 400
    ) {
      return {
        type: 'auth',
        message: 'بيانات الدخول غير صحيحة أو الحساب غير مفعل',
        originalError: error
      };
    }

    // Server errors
    if (
      error?.status >= 500 ||
      errorMessage.includes('Internal server error') ||
      errorMessage.includes('Service unavailable')
    ) {
      return {
        type: 'server',
        message: 'الخادم غير متاح حالياً، حاول مرة أخرى بعد قليل',
        originalError: error
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: errorMessage,
      originalError: error
    };
  };

  const enhancedSignIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: AuthError }> => {
    setLoading(true);
    setAuthError(null);
    setRetryCount(0);

    // Pre-flight checks
    if (!networkStatus.isOnline) {
      const networkError: AuthError = {
        type: 'network',
        message: 'لا يوجد اتصال بالإنترنت'
      };
      setAuthError(networkError);
      setLoading(false);
      return { success: false, error: networkError };
    }

    let lastError: AuthError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt - 1);

        logInfo(`Sign in attempt ${attempt}/${maxRetries}`, { 
          email, 
          networkOnline: networkStatus.isOnline,
          attempt 
        });

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        // Enhanced sign in with timeout
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });

        // Race between sign in and timeout
        const result = await Promise.race([
          signInPromise,
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Request timeout'));
            });
          })
        ]) as any;

        clearTimeout(timeoutId);

        if (result.error) {
          throw result.error;
        }

        // Success
        logInfo('Sign in successful', { email, attempt });
        setLoading(false);
        return { success: true };

      } catch (error: any) {
        lastError = classifyError(error);

        logError(
          `Sign in attempt ${attempt} failed`,
          error,
          { 
            email, 
            attempt, 
            maxRetries,
            errorType: lastError.type,
            networkOnline: networkStatus.isOnline
          }
        );

        // Log network error if it's network-related
        if (lastError.type === 'network' || lastError.type === 'timeout') {
          logNetworkError({
            type: lastError.type === 'timeout' ? 'timeout' : 'fetch_failed',
            message: lastError.message,
            context: {
              action: 'sign_in',
              attempt,
              email
            }
          });
        }

        // Don't retry for auth errors or if it's the last attempt
        if (lastError.type === 'auth' || attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    setAuthError(lastError!);
    setLoading(false);

    // Handle the error through the centralized error handler
    handleError(lastError!.originalError || new Error(lastError!.message), {
      action: 'enhanced_sign_in',
      email,
      attempts: maxRetries,
      errorType: lastError!.type
    });

    return { success: false, error: lastError! };
  }, [
    maxRetries,
    retryDelay,
    timeoutMs,
    networkStatus.isOnline,
    logNetworkError,
    handleError
  ]);

  const retrySignIn = useCallback((email: string, password: string) => {
    return enhancedSignIn(email, password);
  }, [enhancedSignIn]);

  const clearError = useCallback(() => {
    setAuthError(null);
    setRetryCount(0);
  }, []);

  return {
    enhancedSignIn,
    retrySignIn,
    authError,
    loading,
    retryCount,
    clearError,
    networkStatus
  };
};