// مراقب الأمان لتتبع الأنشطة المشبوهة
import { toast } from 'sonner';

export interface SecurityEvent {
  type: 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'IMPERSONATION_ATTEMPT' | 'DATA_TAMPERING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  details: Record<string, any>;
}

export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_STORED_EVENTS = 100;
  
  // تسجيل حدث أمني
  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(securityEvent);

    // الحفاظ على آخر أحداث فقط
    if (this.events.length > this.MAX_STORED_EVENTS) {
      this.events.shift();
    }

    // عرض تنبيه للأحداث عالية الخطورة
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      toast.error(`تحذير أمني: ${event.message}`);
    }

    // حفظ الأحداث المهمة في localStorage
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      this.saveToStorage(securityEvent);
    }

    console.warn('Security Event:', securityEvent);
  }

  // فحص محاولة الوصول غير المصرح بها
  static checkUnauthorizedAccess(userId: string, requiredRole: string, currentRole: string): boolean {
    if (currentRole !== requiredRole) {
      this.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        message: `محاولة وصول غير مصرح بها إلى وظيفة ${requiredRole}`,
        userId,
        details: {
          requiredRole,
          currentRole,
          action: 'impersonation_attempt'
        }
      });
      return false;
    }
    return true;
  }

  // فحص تلاعب البيانات
  static checkDataTampering(data: any, expectedSignature: string, actualSignature: string): boolean {
    if (expectedSignature !== actualSignature) {
      this.logSecurityEvent({
        type: 'DATA_TAMPERING',
        severity: 'CRITICAL',
        message: 'تم اكتشاف تلاعب في البيانات الحساسة',
        details: {
          expectedSignature,
          actualSignature,
          dataType: typeof data
        }
      });
      return false;
    }
    return true;
  }

  // فحص النشاط المشبوه
  static checkSuspiciousActivity(userId: string, action: string, details: Record<string, any>): void {
    // فحص المحاولات المتكررة
    const recentEvents = this.events.filter(
      event => event.userId === userId && 
      Date.now() - event.timestamp < 60000 && // آخر دقيقة
      event.type === 'IMPERSONATION_ATTEMPT'
    );

    if (recentEvents.length > 3) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        message: 'نشاط مشبوه: محاولات متكررة للانتحال',
        userId,
        details: {
          action,
          recentAttempts: recentEvents.length,
          ...details
        }
      });
    }
  }

  // التحقق من صحة URL parameters
  static validateUrlParameters(adminId: string, currentUserId: string): boolean {
    if (adminId !== currentUserId) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        message: 'عدم تطابق معرف الأدمن في URL',
        userId: currentUserId,
        details: {
          urlAdminId: adminId,
          currentUserId,
          source: 'url_validation'
        }
      });
      return false;
    }
    return true;
  }

  // الحصول على أحداث الأمان
  static getSecurityEvents(severity?: SecurityEvent['severity']): SecurityEvent[] {
    if (severity) {
      return this.events.filter(event => event.severity === severity);
    }
    return [...this.events];
  }

  // مسح أحداث الأمان
  static clearSecurityEvents(): void {
    this.events = [];
    localStorage.removeItem('security_events');
  }

  // حفظ في localStorage
  private static saveToStorage(event: SecurityEvent): void {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      storedEvents.push(event);
      
      // الحفاظ على آخر 50 حدث فقط
      if (storedEvents.length > 50) {
        storedEvents.splice(0, storedEvents.length - 50);
      }
      
      localStorage.setItem('security_events', JSON.stringify(storedEvents));
    } catch (error) {
      console.error('Failed to save security event:', error);
    }
  }

  // الحصول على إحصائيات الأمان
  static getSecurityStats(): {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    lastEvent?: SecurityEvent;
  } {
    const criticalEvents = this.events.filter(e => e.severity === 'CRITICAL').length;
    const highSeverityEvents = this.events.filter(e => e.severity === 'HIGH').length;
    const lastEvent = this.events[this.events.length - 1];

    return {
      totalEvents: this.events.length,
      criticalEvents,
      highSeverityEvents,
      lastEvent
    };
  }
}