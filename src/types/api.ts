// أنواع استجابات API والعمليات
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
}

export interface AsyncOperationState<T = unknown> extends LoadingState {
  data?: T;
  refetch: () => Promise<void>;
}

// أنواع العمليات CRUD
export interface CrudOperations<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  items: T[];
  loading: boolean;
  error?: string;
  create: (data: CreateData) => Promise<T>;
  read: (id: string) => Promise<T>;
  update: (id: string, data: UpdateData) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (params?: QueryParams) => Promise<T[]>;
  refetch: () => Promise<void>;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
  include?: string[];
}

// أنواع البحث والتصفية
export interface SearchState {
  query: string;
  filters: Record<string, unknown>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  label: string;
  value: string;
  order?: 'asc' | 'desc';
}

// أنواع رفع الملفات
export interface FileUploadOptions {
  allowedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  bucket?: string;
  folder?: string;
  generateThumbnail?: boolean;
}

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  type: string;
  thumbnail?: string;
}

// أنواع Cache والـ State Management
export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  maxSize?: number;
  invalidateOn?: string[];
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expires: number;
}

// أنواع الأحداث والتتبع
export interface EventLog {
  id: string;
  event_type: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, unknown>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditTrail {
  id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  user_id?: string;
  timestamp: string;
}

// أنواع الإشعارات
export interface NotificationPayload {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// أنواع التصدير والاستيراد
export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf' | 'json';
  includeHeaders?: boolean;
  fields?: string[];
  filters?: Record<string, unknown>;
}

export interface ImportResult {
  total: number;
  success: number;
  errors: Array<{
    row: number;
    message: string;
    data?: Record<string, unknown>;
  }>;
}

// أنواع الأمان والصلاحيات
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface SecurityContext {
  user_id: string;
  role: string;
  permissions: Permission[];
  school_id?: string;
  session_id: string;
}

// أنواع الإحصائيات والتحليلات
export interface AnalyticsData {
  metric: string;
  value: number;
  change?: number;
  changePercent?: number;
  period: string;
  breakdown?: Record<string, number>;
}

export interface DashboardMetrics {
  [key: string]: AnalyticsData;
}

// أنواع الأخطاء المخصصة
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  requestId?: string;
}

export interface ValidationError extends AppError {
  field: string;
  constraint: string;
  value?: unknown;
}