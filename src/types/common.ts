import { Database } from '@/integrations/supabase/types';

// استخراج الأنواع الأساسية من قاعدة البيانات
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type School = Database['public']['Tables']['schools']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type AcademicYear = Database['public']['Tables']['academic_years']['Row'];
export type ClassName = Database['public']['Tables']['class_names']['Row'];
export type GradeLevel = Database['public']['Tables']['grade_levels']['Row'];
export type Plugin = Database['public']['Tables']['plugins']['Row'];
export type Package = Database['public']['Tables']['packages']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];

// أنواع للنماذج والمكونات
export interface UserProfile extends Profile {
  schools?: School;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResponse {
  error?: AuthError;
  data?: unknown;
}

export interface StudentWithClass extends Student {
  classes?: {
    id: string;
    class_names: {
      name: string;
    };
    grade_levels: {
      name: string;
    };
  };
}

export interface ClassWithDetails extends Class {
  class_names: ClassName;
  grade_levels: GradeLevel;
  academic_years: AcademicYear;
  _count?: {
    class_students: number;
  };
}

export interface SchoolWithPackage extends School {
  packages?: Package;
  _count?: {
    profiles: number;
    students: number;
    classes: number;
  };
}

// أنواع للمحتوى التعليمي
export interface VideoContent {
  id: string;
  title: string;
  description?: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  grade_level: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentContent {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  grade_level: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonContent {
  id: string;
  title: string;
  description?: string;
  content: string;
  media: {
    images: MediaItem[];
    animations: MediaItem[];
    lottieFiles: MediaItem[];
  };
  grade_level: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectContent {
  id: string;
  title: string;
  description?: string;
  requirements: string;
  deliverables: string;
  grade_level: string;
  course_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamContent {
  id: string;
  title: string;
  description?: string;
  questions: ExamQuestion[];
  time_limit?: number;
  total_points: number;
  grade_level: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  choices?: string[];
  correct_answer?: string;
  points: number;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

// أنواع للأحداث والتقويم
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  color?: string;
  type?: 'exam' | 'holiday' | 'meeting' | 'deadline' | 'other' | 'event' | 'important';
  is_active: boolean;
  event_type?: 'exam' | 'holiday' | 'meeting' | 'deadline' | 'other';
  created_at: string;
  updated_at: string;
}

// أنواع للإحصائيات
export interface DashboardStats {
  totalSchools: number;
  totalAdmins: number;
  totalStudents: number;
  activeAdmins: number;
  activePackages: number;
  totalPackages: number;
  enabledPlugins: number;
  disabledPlugins: number;
  totalPlugins: number;
}

export interface SchoolStats {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  activePackages: number;
}

// أنواع عامة للواجهة
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FormState<T> extends LoadingState {
  data: T;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// أنواع للملفات والتحميل
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

export interface UploadResponse {
  url: string;
  path: string;
  success: boolean;
  error?: string;
}

// Constants
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  SCHOOL_ADMIN: 'school_admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
} as const;

export const PACKAGE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
} as const;

export const PLUGIN_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type PackageStatus = typeof PACKAGE_STATUS[keyof typeof PACKAGE_STATUS];
export type PluginStatus = typeof PLUGIN_STATUS[keyof typeof PLUGIN_STATUS];