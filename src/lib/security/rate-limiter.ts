// نظام Rate Limiting للعمليات الحساسة
export class RateLimiter {
  private static attempts: Map<string, { count: number; firstAttempt: number; lastAttempt: number }> = new Map();
  
  // إعدادات افتراضية
  private static readonly DEFAULT_MAX_ATTEMPTS = 5;
  private static readonly DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
  private static readonly DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 دقائق

  // فحص ما إذا كانت العملية مسموحة
  static isAllowed(
    identifier: string, 
    maxAttempts: number = this.DEFAULT_MAX_ATTEMPTS,
    windowMs: number = this.DEFAULT_WINDOW_MS
  ): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      // أول محاولة
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return true;
    }

    // إذا انتهت النافذة الزمنية، إعادة تعيين العداد
    if (now - record.firstAttempt > windowMs) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return true;
    }

    // إذا تم تجاوز الحد الأقصى
    if (record.count >= maxAttempts) {
      record.lastAttempt = now;
      return false;
    }

    // زيادة العداد
    record.count++;
    record.lastAttempt = now;
    return true;
  }

  // الحصول على وقت الانتظار المتبقي
  static getCooldownTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.count < this.DEFAULT_MAX_ATTEMPTS) {
      return 0;
    }

    const timeSinceLastAttempt = Date.now() - record.lastAttempt;
    const remainingCooldown = this.DEFAULT_COOLDOWN_MS - timeSinceLastAttempt;
    
    return Math.max(0, remainingCooldown);
  }

  // تسجيل محاولة فاشلة
  static recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (record) {
      record.count++;
      record.lastAttempt = now;
    } else {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    }
  }

  // إعادة تعيين المحاولات لمعرف معين
  static resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  // تنظيف السجلات القديمة
  static cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.attempts.forEach((record, key) => {
      if (now - record.lastAttempt > this.DEFAULT_WINDOW_MS) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.attempts.delete(key);
    });
  }

  // الحصول على إحصائيات المحاولات
  static getAttemptStats(identifier: string): {
    attempts: number;
    remainingAttempts: number;
    cooldownTime: number;
    isBlocked: boolean;
  } {
    const record = this.attempts.get(identifier);
    
    if (!record) {
      return {
        attempts: 0,
        remainingAttempts: this.DEFAULT_MAX_ATTEMPTS,
        cooldownTime: 0,
        isBlocked: false
      };
    }

    const remainingAttempts = Math.max(0, this.DEFAULT_MAX_ATTEMPTS - record.count);
    const cooldownTime = this.getCooldownTime(identifier);
    const isBlocked = record.count >= this.DEFAULT_MAX_ATTEMPTS && cooldownTime > 0;

    return {
      attempts: record.count,
      remainingAttempts,
      cooldownTime,
      isBlocked
    };
  }
}