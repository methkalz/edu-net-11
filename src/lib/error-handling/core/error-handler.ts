// معالج الأخطاء الرئيسي
import type { AppError, ValidationError, ErrorHandlerConfig } from '../types/error-types';
import { ErrorFactory } from '../factory/error-factory';
import { ToastNotifier } from '../notifiers/toast-notifier';
import { MonitoringReporter } from '../notifiers/monitoring-reporter';
import { logger } from '../../logger';

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private config: ErrorHandlerConfig;
  
  private constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      enableUserNotifications: true,
      enableMonitoring: true,
      isDevelopment: import.meta.env.DEV,
      maxCriticalErrors: 50,
      ...config
    };
  }
  
  static getInstance(config?: Partial<ErrorHandlerConfig>): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler(config);
    }
    return AppErrorHandler.instance;
  }

  handleError(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = ErrorFactory.createFromUnknown(error, context);
    
    // تسجيل الخطأ
    logger.error(appError.message, new Error(appError.message), {
      code: appError.code,
      context: appError.details,
      userId: appError.userId,
      requestId: appError.requestId
    });

    // عرض الإشعار للمستخدم
    if (this.config.enableUserNotifications) {
      ToastNotifier.showError(appError);
    }

    // إرسال للمراقبة في الإنتاج
    if (!this.config.isDevelopment && this.config.enableMonitoring) {
      MonitoringReporter.reportError(appError);
    }

    return appError;
  }

  // دوال مساعدة للتحقق من نوع الخطأ
  isNetworkError(error: AppError): boolean {
    return error.code.includes('NETWORK') || error.code === 'network_error';
  }

  isValidationError(error: AppError): boolean {
    return error.code.includes('VALIDATION') || error.code === '23505';
  }

  isPermissionError(error: AppError): boolean {
    return error.code === '42501' || error.code.includes('UNAUTHORIZED');
  }

  // إنشاء أخطاء مخصصة
  createValidationError(field: string, message: string, value?: unknown): ValidationError {
    return ErrorFactory.createValidationError(field, message, value);
  }

  // معالج للأخطاء غير المتوقعة
  handleUnexpectedError = (error: unknown): void => {
    this.handleError(error, { source: 'unexpected' });
  }

  // معالج لأخطاء React Error Boundary
  handleReactError = (error: Error, errorInfo: { componentStack: string }): void => {
    this.handleError(error, { 
      source: 'react',
      componentStack: errorInfo.componentStack 
    });
  }

  // إحصائيات الأخطاء
  getErrorStats() {
    return {
      storedErrorsCount: MonitoringReporter.getStoredErrorsCount(),
      config: this.config
    };
  }

  // تنظيف الأخطاء المحفوظة
  clearStoredErrors(): void {
    MonitoringReporter.clearStoredErrors();
  }

  // تصدير الأخطاء للتشخيص
  exportStoredErrors(): string {
    return MonitoringReporter.exportStoredErrors();
  }
}