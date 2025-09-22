// أنواع التسجيل الأساسية
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerConfig {
  isDevelopment: boolean;
  maxLogEntries: number;
  enableLocalStorage: boolean;
}