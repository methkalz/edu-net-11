// أنواع خصائص المكونات المشتركة
import { ReactNode } from 'react';
import { 
  DocumentResponse, 
  VideoResponse, 
  ProjectResponse, 
  EventResponse,
  UploadResponse 
} from './api-responses';

// خصائص مكونات النماذج
export interface FormComponentProps<T> {
  initialData?: T;
  onSave: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

// خصائص مكونات القوائم
export interface ListComponentProps<T> {
  items: T[];
  loading?: boolean;
  error?: string;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  emptyMessage?: string;
  searchable?: boolean;
  filterable?: boolean;
}

// خصائص مكونات الجداول
export interface TableComponentProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

// خصائص مكونات رفع الملفات
export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload: (files: File[]) => Promise<UploadResponse[]>;
  onComplete?: (responses: UploadResponse[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

// خصائص مكونات الوسائط
export interface MediaPreviewProps {
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
  description?: string;
  onClose?: () => void;
  controls?: boolean;
  autoPlay?: boolean;
}

// خصائص مكونات النماذج المحددة
export interface DocumentFormProps extends FormComponentProps<DocumentResponse> {
  categories: string[];
  gradeLevels: string[];
  uploadFile?: (file: File, path: string) => Promise<UploadResponse>;
}

export interface VideoFormProps extends FormComponentProps<VideoResponse> {
  categories: string[];
  gradeLevels: string[];
  onPreview?: (videoData: VideoResponse) => void;
}

export interface ProjectFormProps extends FormComponentProps<ProjectResponse> {
  gradeLevels: string[];
  courses?: Array<{ id: string; name: string }>;
}

export interface EventFormProps extends FormComponentProps<EventResponse> {
  eventTypes: string[];
  schools?: Array<{ id: string; name: string }>;
}

// خصائص مكونات لعبة المعرفة
export interface GameProps {
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  timeLimit?: number;
  onGameComplete?: (score: number, time: number) => void;
  onGameExit?: () => void;
}

export interface QuizProps {
  questions: QuizQuestion[];
  timeLimit?: number;
  showResults?: boolean;
  onComplete?: (results: QuizResults) => void;
  onExit?: () => void;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  choices?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

export interface QuizResults {
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    points: number;
  }>;
}

// خصائص مكونات إدارة المحتوى
export interface ContentManagerProps {
  gradeLevel: string;
  category?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  showBulkActions?: boolean;
}

// خصائص المكونات التفاعلية
export interface InteractiveComponentProps {
  onExpand?: () => void;
  onCollapse?: () => void;
  expandable?: boolean;
  defaultExpanded?: boolean;
  animation?: boolean;
  loading?: boolean;
}

// خصائص مكونات التنقل
export interface NavigationProps {
  items: NavigationItem[];
  currentPath: string;
  onNavigate?: (path: string) => void;
  collapsible?: boolean;
  showIcons?: boolean;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: ReactNode;
  children?: NavigationItem[];
  badge?: string | number;
  disabled?: boolean;
  permission?: string;
}

// خصائص مكونات الإشعارات
export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// خصائص مكونات التصفية والبحث
export interface FilterProps {
  filters: FilterOption[];
  selectedFilters: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  onReset?: () => void;
  compact?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  multiple?: boolean;
}