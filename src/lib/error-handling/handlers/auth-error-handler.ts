/**
 * Authentication-Specific Error Handler
 * 
 * معالج متخصص لأخطاء المصادقة وتسجيل الخروج
 * يتعامل مع الحالات الخاصة مثل الجلسات المنتهية وفشل تسجيل الخروج
 */

import { AppErrorHandler } from '../core/error-handler';
import { sessionMonitor } from '@/lib/auth/session-monitor';
import { toast } from '@/hooks/use-toast';
import type { AppError } from '../types/error-types';

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private baseHandler: AppErrorHandler;

  private constructor() {
    this.baseHandler = AppErrorHandler.getInstance();
  }

  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  // معالجة أخطاء تسجيل الخروج
  public handleLogoutError(error: unknown, context?: Record<string, unknown>): void {
    const appError = this.baseHandler.handleError(error, {
      ...context,
      action: 'logout',
      component: 'auth'
    });

    // التعامل مع أخطاء تسجيل الخروج الشائعة
    if (this.isSessionNotFoundError(appError)) {
      this.handleSessionNotFound();
    } else if (this.isNetworkError(appError)) {
      this.handleNetworkErrorDuringLogout();
    } else if (this.isPermissionError(appError)) {
      this.handlePermissionErrorDuringLogout();
    } else {
      this.handleGenericLogoutError(appError);
    }
  }

  // فحص ما إذا كان الخطأ متعلق بجلسة غير موجودة
  private isSessionNotFoundError(error: AppError): boolean {
    const message = error.message.toLowerCase();
    const code = error.code.toLowerCase();
    
    return message.includes('session not found') || 
           message.includes('session') || 
           code === '403' ||
           code.includes('session') ||
           code.includes('forbidden');
  }

  // فحص ما إذا كان الخطأ متعلق بالشبكة
  private isNetworkError(error: AppError): boolean {
    return this.baseHandler.isNetworkError(error);
  }

  // فحص ما إذا كان الخطأ متعلق بالصلاحيات
  private isPermissionError(error: AppError): boolean {
    return this.baseHandler.isPermissionError(error);
  }

  // التعامل مع جلسة غير موجودة
  private handleSessionNotFound(): void {
    console.log('Session not found during logout - cleaning up locally');
    
    // تنظيف البيانات المحلية
    this.forceLocalCleanup();
    
    toast({
      title: "تم تسجيل الخروج",
      description: "انتهت صلاحية الجلسة مسبقاً",
    });

    // إعادة التوجيه
    this.redirectToAuth();
  }

  // التعامل مع أخطاء الشبكة أثناء تسجيل الخروج
  private handleNetworkErrorDuringLogout(): void {
    console.log('Network error during logout - proceeding with local cleanup');
    
    this.forceLocalCleanup();
    
    toast({
      title: "تم تسجيل الخروج محلياً",
      description: "لا يوجد اتصال بالإنترنت، تم الخروج محلياً",
      variant: "destructive"
    });

    this.redirectToAuth();
  }

  // التعامل مع أخطاء الصلاحيات أثناء تسجيل الخروج
  private handlePermissionErrorDuringLogout(): void {
    console.log('Permission error during logout - forcing local cleanup');
    
    this.forceLocalCleanup();
    
    toast({
      title: "تم تسجيل الخروج",
      description: "تم إنهاء الجلسة بسبب انتهاء الصلاحيات",
      variant: "destructive"
    });

    this.redirectToAuth();
  }

  // التعامل مع أخطاء عامة في تسجيل الخروج
  private handleGenericLogoutError(error: AppError): void {
    console.warn('Generic logout error, proceeding with local cleanup:', error);
    
    this.forceLocalCleanup();
    
    toast({
      title: "تم تسجيل الخروج",
      description: "حدث خطأ، لكن تم تسجيل الخروج محلياً",
      variant: "destructive"
    });

    this.redirectToAuth();
  }

  // تنظيف قسري للبيانات المحلية
  private forceLocalCleanup(): void {
    try {
      // إزالة جميع البيانات المتعلقة بالمصادقة
      const authKeys = Object.keys(localStorage).filter(key =>
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
      );

      authKeys.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();

      // تعيين علامة لمنع إعادة التوجيه التلقائي
      localStorage.setItem('recent_manual_logout', Date.now().toString());

    } catch (storageError) {
      console.warn('Error during force cleanup:', storageError);
    }
  }

  // إعادة التوجيه إلى صفحة المصادقة
  private redirectToAuth(): void {
    // إيقاف مراقبة الجلسة
    sessionMonitor.stopMonitoring();
    
    // تأخير قصير قبل إعادة التوجيه
    setTimeout(() => {
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }, 500);
  }
}

// تصدير instance وحيد
export const authErrorHandler = AuthErrorHandler.getInstance();