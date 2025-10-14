// نظام التشفير الآمن باستخدام Web Crypto API
// يستخدم AES-GCM (256-bit) للتشفير

export class ServerEncryption {
  // الحصول على مفتاح التشفير من المتغيرات البيئية
  private static async getKey(): Promise<CryptoKey> {
    const masterKey = Deno.env.get('ENCRYPTION_MASTER_KEY');
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY is not set');
    }
    
    // تحويل المفتاح النصي إلى CryptoKey
    const encoder = new TextEncoder();
    const keyData = encoder.encode(masterKey);
    
    return await crypto.subtle.importKey(
      'raw',
      keyData.slice(0, 32), // استخدام أول 32 بايت فقط (256-bit)
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // تشفير نص مع حفظ IV
  public static async encrypt(plaintext: string): Promise<string> {
    try {
      const key = await this.getKey();
      
      // إنشاء IV عشوائي (12 بايت للـ AES-GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // تشفير البيانات
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // دمج IV + Ciphertext معاً
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // تحويل إلى Base64 URL-safe
      return btoa(String.fromCharCode(...combined))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // فك تشفير النص
  public static async decrypt(ciphertext: string): Promise<string> {
    try {
      const key = await this.getKey();
      
      // تحويل من Base64 URL-safe
      const base64 = ciphertext
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const combined = Uint8Array.from(
        atob(base64),
        c => c.charCodeAt(0)
      );
      
      // فصل IV عن Ciphertext
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // فك التشفير
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // فحص ما إذا كان النص مشفراً
  public static isEncrypted(text: string): boolean {
    try {
      // محاولة فك التشفير - إذا نجحت فالنص مشفر
      const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64);
      return decoded.length > 12; // على الأقل IV + بيانات
    } catch {
      return false;
    }
  }
}
