// Logger الأساسي
import type { LogLevel, LogEntry, LoggerConfig } from '../types/log-types';
import { MemoryLogStorage } from '../storage/memory-storage';
import { LocalLogStorage } from '../storage/local-storage';
import { LogFormatter } from '../utils/log-formatter';

export class Logger {
  private config: LoggerConfig;
  private memoryStorage: MemoryLogStorage;
  private localStorage: LocalLogStorage;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      isDevelopment: import.meta.env.DEV,
      maxLogEntries: 1000,
      enableLocalStorage: true,
      ...config
    };
    
    this.memoryStorage = new MemoryLogStorage(this.config.maxLogEntries);
    this.localStorage = new LocalLogStorage();
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: Record<string, unknown>, 
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: LogFormatter.formatTimestamp(),
      context,
      error
    };
  }

  private addLogEntry(entry: LogEntry): void {
    this.memoryStorage.addLogEntry(entry);

    // حفظ السجلات المهمة في localStorage للتطوير
    if (this.config.isDevelopment && this.config.enableLocalStorage && 
        (entry.level === 'error' || entry.level === 'warn')) {
      this.localStorage.saveImportantLog(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.isDevelopment) return true;
    
    // في الإنتاج، سجل فقط التحذيرات والأخطاء
    return level === 'warn' || level === 'error';
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, context);
    this.addLogEntry(entry);

    if (this.config.isDevelopment) {
      console.debug(LogFormatter.formatConsoleMessage('debug', message), context || '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, context);
    this.addLogEntry(entry);

    if (this.config.isDevelopment) {
      console.info(LogFormatter.formatConsoleMessage('info', message), context || '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context);
    this.addLogEntry(entry);

    console.warn(LogFormatter.formatConsoleMessage('warn', message), context || '');
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, context, error);
    this.addLogEntry(entry);

    console.error(LogFormatter.formatConsoleMessage('error', message), {
      error: error?.message,
      stack: error?.stack,
      context
    });

    // إرسال الأخطاء المهمة لخدمة المراقبة في الإنتاج
    if (!this.config.isDevelopment) {
      this.reportError(entry);
    }
  }

  private async reportError(entry: LogEntry): Promise<void> {
    try {
      // يمكن إضافة إرسال للسجلات إلى خدمة مراقبة خارجية هنا
      // مثل Sentry أو LogRocket
      
      // للآن، نحفظ في Supabase إذا كان خطأ خطير
      if (entry.error || entry.level === 'error') {
        // يمكن إضافة منطق حفظ السجلات في قاعدة البيانات هنا
      }
    } catch (e) {
      // تجاهل أخطاء الإرسال لتجنب الحلقة اللانهائية
    }
  }

  // الحصول على السجلات للتطوير والتشخيص
  getLogs(level?: LogLevel): LogEntry[] {
    return this.memoryStorage.getLogs(level);
  }

  // تنظيف السجلات
  clearLogs(): void {
    this.memoryStorage.clearLogs();
    this.localStorage.clearStoredLogs();
  }

  // تصدير السجلات للتشخيص
  exportLogs(): string {
    return this.memoryStorage.exportLogs();
  }
}