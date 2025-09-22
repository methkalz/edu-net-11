// أنواع استجابات API المشتركة
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  total: number;
  page?: number;
  limit?: number;
}

// استجابات المعلمين
export interface TeacherResponse {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  username?: string;
  school_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// استجابات المدارس
export interface SchoolResponse {
  id: string;
  name: string;
  name_en?: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  established_year?: number;
  description?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

// استجابات الفيديوهات
export interface VideoResponse {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  source_type: 'youtube' | 'vimeo' | 'direct' | 'embedded';
  duration?: number;
  category?: string;
  grade_level: string;
  course_id?: string;
  is_visible: boolean;
  allowed_roles?: string[];
  order_index?: number;
  created_at: string;
  updated_at: string;
}

// استجابات المشاريع
export interface ProjectResponse {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  deliverables?: string;
  grade_level: string;
  course_id?: string;
  due_date?: string;
  status: 'draft' | 'published' | 'archived';
  max_points?: number;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

// استجابات المستندات
export interface DocumentResponse {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  category: string;
  grade_level: string;
  course_id?: string;
  owner_user_id: string;
  school_id?: string;
  is_visible: boolean;
  allowed_roles?: string[];
  order_index?: number;
  created_at: string;
  updated_at: string;
}

// استجابات الأحداث
export interface EventResponse {
  id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  time?: string;
  location?: string;
  event_type: string;
  is_public: boolean;
  school_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// استجابات الإحصائيات
export interface StatsResponse {
  total_students: number;
  total_teachers: number;
  total_schools: number;
  active_classes: number;
  total_content: number;
  recent_activities: number;
}

// أنواع الأخطاء الشائعة في API
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Generic type لاستجابات API
export type ApiResponse<T> = BaseApiResponse & {
  data?: T;
};

// نوع لملفات الرفع
export interface UploadResponse {
  url: string;
  path: string;
  size?: number;
  type?: string;
  name?: string;
}

// أنواع الفورم المشتركة
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// أنواع المرشحات والبحث
export interface SearchFilters {
  query?: string;
  category?: string;
  grade_level?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// أنواع الصفحات المتعددة
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}