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

// أنواع المحتوى التعليمي للصفوف المختلفة
export interface BaseContent {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active?: boolean;
  order_index?: number;
}

export interface VideoContent extends BaseContent {
  video_url: string;
  duration?: number;
  thumbnail_url?: string;
  source_type: 'youtube' | 'vimeo' | 'direct' | 'embedded';
  grade_level: string;
  course_id?: string;
  category?: string;
  is_visible?: boolean;
  allowed_roles?: string[];
  published_at?: string;
  file_type?: string;
  file_size?: number;
}

export interface DocumentContent extends BaseContent {
  file_path: string;
  file_type: string;
  file_size?: number;
  grade_level: string;
  course_id?: string;
  owner_user_id: string;
  school_id?: string;
}

export interface ProjectContent extends BaseContent {
  requirements?: string;
  deliverables?: string;
  grade_level: string;
  course_id?: string;
  due_date?: string;
  status?: 'draft' | 'published' | 'archived';
  max_points?: number;
}

// أنواع محددة للصف الحادي عشر
export interface Grade11Section extends BaseContent {
  topics: Grade11Topic[];
}

export interface Grade11Topic extends BaseContent {
  section_id: string;
  content?: string;
  lessons?: Grade11Lesson[];
}

export interface Grade11Lesson extends BaseContent {
  topic_id: string;
  content?: string;
  media?: Grade11LessonMedia[];
}

export interface Grade11LessonMedia {
  id: string;
  lesson_id: string;
  media_type: 'video' | 'lottie' | 'image' | 'code';
  file_path: string;
  file_name: string;
  metadata: Record<string, unknown>;
  order_index: number;
  created_at: string;
}

// أنواع الفحوصات والاختبارات
export interface ExamContent extends BaseContent {
  questions: ExamQuestion[];
  time_limit?: number;
  total_points: number;
  grade_level: string;
  course_id?: string;
  exam_type?: 'quiz' | 'midterm' | 'final' | 'practice';
  start_date?: string;
  end_date?: string;
  attempts_allowed?: number;
}

export interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'code';
  choices?: string[];
  correct_answer?: string;
  points: number;
  explanation?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

// أنواع الألعاب التعليمية
export interface GameContent extends BaseContent {
  game_type: 'quiz' | 'adventure' | 'puzzle' | 'simulation';
  config: Record<string, unknown>;
  grade_level: string;
  subject?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  estimated_duration?: number;
}

// أنواع المهام الافتراضية
export interface DefaultTask {
  id: string;
  title: string;
  description?: string;
  task_type: 'reading' | 'exercise' | 'project' | 'research';
  estimated_hours?: number;
  prerequisites?: string[];
  resources?: string[];
  grade_level: string;
  subject?: string;
  is_required?: boolean;
  order_index?: number;
}

// أنواع التقدم والإحصائيات
export interface StudentProgress {
  student_id: string;
  content_id: string;
  content_type: 'video' | 'document' | 'lesson' | 'project' | 'exam' | 'game';
  progress_percentage: number;
  time_spent?: number;
  completed_at?: string;
  score?: number;
  attempts?: number;
  last_accessed: string;
}

export interface ContentStats {
  total_items: number;
  published_items: number;
  draft_items: number;
  archived_items: number;
  total_views: number;
  average_score?: number;
  completion_rate?: number;
}