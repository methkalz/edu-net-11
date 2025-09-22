// React Hook لمعالجة الأخطاء
import { AppErrorHandler } from '../core/error-handler';
import { handleAsyncError } from '../utils/async-helpers';
import type { AppError, ValidationError } from '../types/error-types';

const errorHandler = AppErrorHandler.getInstance();

export const useErrorHandler = () => {
  return {
    handleError: (error: unknown, context?: Record<string, unknown>) =>
      errorHandler.handleError(error, context),
    
    handleAsyncError,
    
    isNetworkError: (error: AppError) => errorHandler.isNetworkError(error),
    
    isValidationError: (error: AppError) => errorHandler.isValidationError(error),
    
    isPermissionError: (error: AppError) => errorHandler.isPermissionError(error),
    
    createValidationError: (field: string, message: string, value?: unknown) =>
      errorHandler.createValidationError(field, message, value),
    
    getErrorStats: () => errorHandler.getErrorStats(),
    
    clearStoredErrors: () => errorHandler.clearStoredErrors(),
    
    exportStoredErrors: () => errorHandler.exportStoredErrors()
  };
};