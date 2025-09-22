// مساعدات للعمليات غير المتزامنة
import { AppErrorHandler } from '../core/error-handler';

const errorHandler = AppErrorHandler.getInstance();

// معالج للعمليات غير المتزامنة
export const handleAsyncError = async <T>(
  asyncOperation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | null> => {
  try {
    return await asyncOperation();
  } catch (error) {
    errorHandler.handleError(error, context);
    return null;
  }
};

// Wrapper للعمليات مع retry
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: Record<string, unknown>
): Promise<T | null> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // انتظار قبل المحاولة التالية
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  // معالجة الخطأ النهائي
  errorHandler.handleError(lastError, { 
    ...context, 
    maxRetries, 
    finalAttempt: true 
  });
  
  return null;
};

// Safe wrapper للدوال
export const safeExecute = <T>(
  fn: () => T,
  fallback: T,
  context?: Record<string, unknown>
): T => {
  try {
    return fn();
  } catch (error) {
    errorHandler.handleError(error, context);
    return fallback;
  }
};