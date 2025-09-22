// أنواع البيانات للمشاريع المصغرة - الصف العاشر

export interface Grade10MiniProject {
  id: string;
  title: string;
  description?: string;
  content: string;
  student_id: string;
  school_id?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed';
  progress_percentage: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Grade10ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
  created_by: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Grade10ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  comment_text: string;
  comment_type: 'comment' | 'feedback' | 'note';
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grade10ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  uploaded_by: string;
  is_image: boolean;
  alt_text?: string;
  created_at: string;
}

export interface ProjectFormData {
  title: string;
  description?: string;
  due_date?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  order_index?: number;
}

export interface CommentFormData {
  comment_text: string;
  comment_type: 'comment' | 'feedback' | 'note';
  is_private: boolean;
}