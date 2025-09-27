/**
 * Authentication System Index
 * 
 * نقطة دخول موحدة لنظام المصادقة المحسن
 * يصدر جميع الأدوات والمكونات المطلوبة لإدارة المصادقة وتسجيل الخروج
 */

export { sessionMonitor } from './session-monitor';
export { authErrorHandler } from '../error-handling/handlers/auth-error-handler';
export { useLogoutManager } from '../../hooks/useLogoutManager';
export { LogoutButton } from '../../components/auth/LogoutButton';

/**
 * دوال مساعدة للنظام الجديد
 */
export const AuthUtils = {
  // فحص حالة تسجيل الخروج
  isLogoutInProgress: (): boolean => {
    return Boolean(
      localStorage.getItem('logout_in_progress') ||
      localStorage.getItem('recent_manual_logout')
    );
  },

  // تنظيف حالة تسجيل الخروج
  clearLogoutState: (): void => {
    localStorage.removeItem('logout_in_progress');
    localStorage.removeItem('recent_manual_logout');
  },

  // فحص ما إذا كانت الجلسة منتهية الصلاحية
  isSessionExpired: (session: any): boolean => {
    if (!session || !session.expires_at) return true;
    const expiresAt = session.expires_at * 1000;
    return expiresAt < Date.now();
  },

  // تأخير قصير مع Promise (مفيد للعمليات غير المتزامنة)
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

/**
 * إعدادات افتراضية لنظام المصادقة
 */
export const AUTH_CONFIG = {
  // مدة الانتظار قبل إعادة المحاولة (بالملي ثانية)
  RETRY_DELAY: 1000,
  
  // الحد الأقصى لمحاولات تسجيل الخروج
  MAX_LOGOUT_ATTEMPTS: 5,
  
  // فترة منع المحاولات المتكررة (بالملي ثانية)
  COOLDOWN_PERIOD: 3000,
  
  // مدة الانتظار لإعادة التوجيه (بالملي ثانية)
  REDIRECT_DELAY: 500,
  
  // فترة مراقبة الجلسة (بالملي ثانية)
  SESSION_MONITOR_INTERVAL: 30000,
  
  // مهلة زمنية لعمليات تسجيل الخروج (بالملي ثانية)
  LOGOUT_TIMEOUT: 5000
} as const;