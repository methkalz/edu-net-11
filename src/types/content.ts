// أنواع المحتوى التعليمي
export interface VideoData {
  id?: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  source_type: 'youtube' | 'vimeo' | 'direct' | 'embedded';
  duration?: number;
  category?: string;
  grade_level: string;
  course_id?: string;
  is_visible?: boolean;
  allowed_roles?: string[];
  order_index?: number;
}

export interface DocumentData {
  id?: string;
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
  is_visible?: boolean;
  allowed_roles?: string[];
  order_index?: number;
}

export interface ProjectData {
  id?: string;
  title: string;
  description?: string;
  requirements?: string;
  deliverables?: string;
  grade_level: string;
  course_id?: string;
  due_date?: string;
  status?: 'draft' | 'published' | 'archived';
  max_points?: number;
  order_index?: number;
}

export interface ExamData {
  id?: string;
  title: string;
  description?: string;
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

export interface ExamTemplate {
  id: string;
  name: string;
  description?: string;
  questions: ExamQuestion[];
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GradeContentItem {
  id: string;
  title: string;
  created_at: string;
  type?: 'video' | 'document' | 'project' | 'exam';
}

export interface GradeContentsData {
  grade10: GradeContentItem[];
  grade11: GradeContentItem[];
  grade12: GradeContentItem[];
}