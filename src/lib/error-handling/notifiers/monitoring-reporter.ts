// إرسال الأخطاء للمراقبة
import type { AppError } from '../types/error-types';

export class MonitoringReporter {
  private static readonly STORAGE_KEY = 'critical_errors';
  private static readonly MAX_STORED_ERRORS = 50;

  static async reportError(error: AppError): Promise<void> {
    try {
      // يمكن إضافة إرسال للسجلات إلى خدمة مراقبة خارجية هنا
      // مثل Sentry أو LogRocket أو Supabase Edge Functions
      
      // للآن، نحفظ الأخطاء المهمة في localStorage للتشخيص
      await this.storeErrorLocally(error);
      
      // في المستقبل يمكن إضافة:
      // await this.sendToSentry(error);
      // await this.sendToSupabase(error);
    } catch (e) {
      // تجاهل أخطاء الإرسال لتجنب الحلقة اللانهائية
    }
  }

  private static async storeErrorLocally(error: AppError): Promise<void> {
    try {
      const criticalErrors = this.getStoredErrors();
      criticalErrors.push(error);
      
      // الحفاظ على آخر أخطاء فقط
      if (criticalErrors.length > this.MAX_STORED_ERRORS) {
        criticalErrors.splice(0, criticalErrors.length - this.MAX_STORED_ERRORS);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(criticalErrors));
    } catch (e) {
      // تجاهل أخطاء التخزين
    }
  }

  private static getStoredErrors(): AppError[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  static getStoredErrorsCount(): number {
    return this.getStoredErrors().length;
  }

  static clearStoredErrors(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      // تجاهل
    }
  }

  static exportStoredErrors(): string {
    return JSON.stringify(this.getStoredErrors(), null, 2);
  }
}