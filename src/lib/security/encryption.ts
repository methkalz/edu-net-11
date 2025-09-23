// نظام تشفير للبيانات الحساسة
import CryptoJS from 'crypto-js';

// مفتاح التشفير المؤقت - في الإنتاج يجب استخدام متغير بيئة آمن
const ENCRYPTION_KEY = 'edunet-secure-impersonation-key-2024';

export class SecureStorage {
  // تشفير البيانات قبل الحفظ
  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('فشل في تشفير البيانات');
    }
  }

  // فك تشفير البيانات عند الاسترجاع
  static decrypt(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('فشل في فك تشفير البيانات');
    }
  }

  // حفظ آمن في localStorage
  static setSecureItem(key: string, value: any): void {
    try {
      const timestamp = Date.now();
      const dataWithTimestamp = {
        data: value,
        timestamp,
        signature: this.generateSignature(value, timestamp)
      };
      const encrypted = this.encrypt(dataWithTimestamp);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('فشل في الحفظ الآمن');
    }
  }

  // استرجاع آمن من localStorage
  static getSecureItem(key: string, maxAge: number = 3600000): any { // default 1 hour
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;

      const dataWithTimestamp = this.decrypt(encryptedData);
      const { data, timestamp, signature } = dataWithTimestamp;

      // فحص انتهاء الصلاحية
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(key);
        throw new Error('انتهت صلاحية الجلسة');
      }

      // فحص التوقيع الرقمي
      if (!this.verifySignature(data, timestamp, signature)) {
        localStorage.removeItem(key);
        throw new Error('تم اكتشاف تلاعب في البيانات');
      }

      return data;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      localStorage.removeItem(key);
      return null;
    }
  }

  // إنشاء توقيع رقمي
  private static generateSignature(data: any, timestamp: number): string {
    const content = JSON.stringify(data) + timestamp.toString();
    return CryptoJS.HmacSHA256(content, ENCRYPTION_KEY).toString();
  }

  // التحقق من التوقيع الرقمي
  private static verifySignature(data: any, timestamp: number, signature: string): boolean {
    const expectedSignature = this.generateSignature(data, timestamp);
    return signature === expectedSignature;
  }

  // مسح آمن للبيانات
  static removeSecureItem(key: string): void {
    localStorage.removeItem(key);
  }

  // مسح جميع البيانات الأمنية
  static clearAllSecureData(): void {
    const keysToRemove = [
      'admin_impersonation_data',
      'impersonated_user_data',
      'is_impersonating'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}