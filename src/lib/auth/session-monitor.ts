/**
 * Session Monitor
 * 
 * يراقب صلاحية الجلسة ويتعامل مع الجلسات المنتهية الصلاحية تلقائياً
 * يمنع الحلقات اللا نهائية من تسجيل الدخول/الخروج
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

class SessionMonitor {
  private static instance: SessionMonitor;
  private isMonitoring = false;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private lastValidationTime = 0;

  public static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) {
      SessionMonitor.instance = new SessionMonitor();
    }
    return SessionMonitor.instance;
  }

  // بدء مراقبة الجلسة
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // فحص الجلسة كل 30 ثانية
    this.sessionCheckInterval = setInterval(() => {
      this.validateSession();
    }, 30000);

    // فحص فوري عند البداية
    this.validateSession();
  }

  // إيقاف مراقبة الجلسة
  public stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // التحقق من صحة الجلسة
  private async validateSession(): Promise<void> {
    const now = Date.now();
    
    // تجنب الفحوصات المتكررة
    if (now - this.lastValidationTime < 10000) return;
    this.lastValidationTime = now;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await this.handleInvalidSession();
        return;
      }

      // فحص انتهاء صلاحية الجلسة
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      
      if (expiresAt && expiresAt < now) {
        console.log('Session expired, handling automatic cleanup');
        await this.handleExpiredSession();
      }

    } catch (error) {
      console.warn('Session validation error:', error);
      await this.handleInvalidSession();
    }
  }

  // التعامل مع الجلسة غير الصحيحة
  private async handleInvalidSession(): Promise<void> {
    // تجنب العمل إذا كان المستخدم في صفحة المصادقة بالفعل
    if (window.location.pathname === '/auth') return;

    // تجنب التنظيف إذا كان هناك تسجيل خروج قيد التنفيذ
    if (localStorage.getItem('logout_in_progress')) return;

    await this.forceCleanupAndRedirect('انتهت صلاحية الجلسة');
  }

  // التعامل مع الجلسة المنتهية الصلاحية
  private async handleExpiredSession(): Promise<void> {
    await this.forceCleanupAndRedirect('انتهت صلاحية جلسة العمل');
  }

  // تنظيف قسري وإعادة توجيه
  private async forceCleanupAndRedirect(message: string): Promise<void> {
    try {
      // محاولة تسجيل خروج نظيف (مع timeout قصير)
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(resolve, 2000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Graceful logout failed during cleanup:', error);
    }

    // تنظيف البيانات المحلية
    this.clearAllLocalData();

    // إظهار رسالة للمستخدم
    toast({
      title: "تم تسجيل الخروج تلقائياً",
      description: message,
      variant: "destructive"
    });

    // منع إعادة التوجيه التلقائي المؤقت
    localStorage.setItem('recent_manual_logout', Date.now().toString());
    
    // إعادة توجيه بعد فترة قصيرة
    setTimeout(() => {
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }, 1000);
  }

  // تنظيف جميع البيانات المحلية
  private clearAllLocalData(): void {
    try {
      // حذف مفاتيح متعلقة بالمصادقة
      const authKeys = Object.keys(localStorage).filter(key =>
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
      );

      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage key: ${key}`, e);
        }
      });

      // تنظيف sessionStorage
      sessionStorage.clear();

    } catch (error) {
      console.warn('Error during local data cleanup:', error);
    }
  }

  // فحص ما إذا كان المستخدم في حالة جلسة غير صحيحة
  public async isInvalidSessionState(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return Boolean(error) || !session;
    } catch {
      return true;
    }
  }
}

// تصدير singleton instance
export const sessionMonitor = SessionMonitor.getInstance();