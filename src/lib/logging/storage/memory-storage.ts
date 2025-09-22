// تخزين السجلات في الذاكرة
import type { LogEntry } from '../types/log-types';

export class MemoryLogStorage {
  private logEntries: LogEntry[] = [];
  private maxLogEntries: number;

  constructor(maxLogEntries: number = 1000) {
    this.maxLogEntries = maxLogEntries;
  }

  addLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);
    
    // الحفاظ على حد أقصى من السجلات
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.shift();
    }
  }

  getLogs(level?: string): LogEntry[] {
    if (!level) return [...this.logEntries];
    return this.logEntries.filter(entry => entry.level === level);
  }

  clearLogs(): void {
    this.logEntries = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  getLogCount(): number {
    return this.logEntries.length;
  }
}