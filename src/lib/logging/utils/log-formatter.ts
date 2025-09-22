// تنسيق رسائل السجلات
import type { LogLevel } from '../types/log-types';

export class LogFormatter {
  static formatConsoleMessage(level: LogLevel, message: string): string {
    const emoji = this.getLevelEmoji(level);
    const levelText = this.getLevelText(level);
    return `${emoji} [${levelText}] ${message}`;
  }

  private static getLevelEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    return emojis[level];
  }

  private static getLevelText(level: LogLevel): string {
    const texts = {
      debug: 'DEBUG',
      info: 'INFO',
      warn: 'WARN',
      error: 'ERROR'
    };
    return texts[level];
  }

  static formatTimestamp(): string {
    return new Date().toISOString();
  }

  static formatContext(context?: Record<string, unknown>): string {
    if (!context || Object.keys(context).length === 0) return '';
    return JSON.stringify(context, null, 2);
  }
}