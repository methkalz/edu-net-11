// إنشاء أخطاء مخصصة
import type { AppError, ValidationError } from '../types/error-types';
import { SupabaseErrorTranslator } from '../translators/supabase-translator';
import { MessageTranslator } from '../translators/message-translator';

export class ErrorFactory {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createFromUnknown(error: unknown, context?: Record<string, unknown>): AppError {
    const timestamp = new Date().toISOString();
    const requestId = this.generateRequestId();

    if (error instanceof Error) {
      // أخطاء Supabase
      if (SupabaseErrorTranslator.isSupabaseError(error)) {
        const supabaseError = error as any;
        return {
          code: supabaseError.code || 'SUPABASE_ERROR',
          message: SupabaseErrorTranslator.translate(supabaseError.code, error.message),
          details: { originalMessage: error.message, ...context },
          timestamp,
          requestId
        };
      }

      // أخطاء JavaScript العادية
      return {
        code: 'JAVASCRIPT_ERROR',
        message: MessageTranslator.translate(error.message),
        details: { stack: error.stack, ...context },
        timestamp,
        requestId
      };
    }

    // أخطاء مخصصة
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const customError = error as Partial<AppError>;
      return {
        code: customError.code || 'UNKNOWN_ERROR',
        message: customError.message || 'حدث خطأ غير متوقع',
        details: { ...customError.details, ...context },
        timestamp,
        requestId,
        userId: customError.userId
      };
    }

    // أخطاء غير معروفة
    return {
      code: 'UNKNOWN_ERROR',
      message: 'حدث خطأ غير متوقع',
      details: { originalError: String(error), ...context },
      timestamp,
      requestId
    };
  }

  static createValidationError(field: string, message: string, value?: unknown): ValidationError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      field,
      constraint: 'custom',
      value,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  static createNetworkError(message: string, context?: Record<string, unknown>): AppError {
    return {
      code: 'NETWORK_ERROR',
      message: MessageTranslator.translate(message),
      details: context,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  static createPermissionError(message: string, userId?: string): AppError {
    return {
      code: 'PERMISSION_ERROR',
      message: MessageTranslator.translate(message),
      details: { userId },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      userId
    };
  }
}