// تخزين السجلات في localStorage
import type { LogEntry, LogLevel } from '../types/log-types';

export class LocalLogStorage {
  private storageKey = 'app_logs';
  private maxStoredLogs = 100;

  saveImportantLog(entry: LogEntry): void {
    if (!this.shouldStoreLog(entry)) return;

    try {
      const existingLogs = this.getStoredLogs();
      existingLogs.push(entry);
      
      // الحفاظ على آخر سجلات فقط
      if (existingLogs.length > this.maxStoredLogs) {
        existingLogs.splice(0, existingLogs.length - this.maxStoredLogs);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existingLogs));
    } catch (e) {
      // تجاهل أخطاء localStorage
    }
  }

  private shouldStoreLog(entry: LogEntry): boolean {
    return entry.level === 'error' || entry.level === 'warn';
  }

  private getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  clearStoredLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      // تجاهل
    }
  }

  getStoredLogsCount(): number {
    return this.getStoredLogs().length;
  }
}