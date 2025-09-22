import CryptoJS from 'crypto-js';

// Environment-based encryption key (should be set in production)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-dev-key-change-in-production';

export class DataEncryption {
  private static readonly ALGORITHM = 'AES';
  
  /**
   * Encrypt sensitive data
   */
  public static encrypt(plaintext: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public static decrypt(ciphertext: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  public static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Generate secure random token
   */
  public static generateToken(length = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Encrypt object (converts to JSON first)
   */
  public static encryptObject(obj: Record<string, unknown>): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt object (parses JSON after decryption)
   */
  public static decryptObject<T = Record<string, unknown>>(ciphertext: string): T {
    const jsonString = this.decrypt(ciphertext);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Mask sensitive data for display
   */
  public static maskData(data: string, visibleChars = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
  }

  /**
   * Validate if string is encrypted (basic check)
   */
  public static isEncrypted(data: string): boolean {
    try {
      // Try to decrypt - if it fails, likely not encrypted
      this.decrypt(data);
      return true;
    } catch {
      return false;
    }
  }
}

// Specific encryption helpers for different data types
export const encryptionHelpers = {
  // Personal data
  encryptPersonalData(data: {
    email?: string;
    phone?: string;
    address?: string;
    nationalId?: string;
  }) {
    const encrypted: Record<string, string> = {};
    
    if (data.email) encrypted.email = DataEncryption.encrypt(data.email);
    if (data.phone) encrypted.phone = DataEncryption.encrypt(data.phone);
    if (data.address) encrypted.address = DataEncryption.encrypt(data.address);
    if (data.nationalId) encrypted.nationalId = DataEncryption.encrypt(data.nationalId);
    
    return encrypted;
  },

  decryptPersonalData(encryptedData: Record<string, string>) {
    const decrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(encryptedData)) {
      try {
        decrypted[key] = DataEncryption.decrypt(value);
      } catch {
        // If decryption fails, return original (might not be encrypted)
        decrypted[key] = value;
      }
    }
    
    return decrypted;
  },

  // Financial data
  encryptFinancialData(amount: number, currency = 'SAR'): string {
    const data = { amount, currency, timestamp: Date.now() };
    return DataEncryption.encryptObject(data);
  },

  decryptFinancialData(encrypted: string): { amount: number; currency: string; timestamp: number } {
    return DataEncryption.decryptObject(encrypted);
  },

  // Temporary passwords
  encryptTemporaryPassword(password: string): string {
    return DataEncryption.encrypt(password);
  },

  decryptTemporaryPassword(encrypted: string): string {
    return DataEncryption.decrypt(encrypted);
  },

  // API keys and secrets
  encryptApiKey(key: string): string {
    return DataEncryption.encrypt(key);
  },

  decryptApiKey(encrypted: string): string {
    return DataEncryption.decrypt(encrypted);
  }
};

// Input sanitization helpers
export const sanitization = {
  /**
   * Sanitize HTML input to prevent XSS
   */
  sanitizeHtml(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  },

  /**
   * Sanitize SQL input to prevent injection
   */
  sanitizeSql(input: string): string {
    return input
      .replace(/['";\\]/g, '')
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|EXEC|EXECUTE)\b/gi, '')
      .trim();
  },

  /**
   * Sanitize file name
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .trim();
  },

  /**
   * Sanitize URL
   */
  sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      return '';
    }
  },

  /**
   * Validate and sanitize email
   */
  sanitizeEmail(email: string): string {
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9@._-]/g, '');
  }
};