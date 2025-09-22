// أنواع الأخطاء الأساسية
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
  userId?: string;
}

export interface ValidationError extends AppError {
  field: string;
  constraint: string;
  value?: unknown;
}

export interface ErrorHandlerConfig {
  enableUserNotifications: boolean;
  enableMonitoring: boolean;
  isDevelopment: boolean;
  maxCriticalErrors: number;
}