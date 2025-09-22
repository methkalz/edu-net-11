import { z } from 'zod';
import { VideoContent, DocumentContent, ProjectContent, ExamContent, Grade11Section, Grade11Topic, Grade11Lesson } from './entities';

// مخططات التحقق من صحة النماذج
export const videoFormSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  video_url: z.string().url('رابط غير صحيح'),
  duration: z.number().positive('المدة يجب أن تكون أكبر من صفر').optional(),
  thumbnail_url: z.string().url('رابط الصورة المصغرة غير صحيح').optional(),
  source_type: z.enum(['youtube', 'vimeo', 'direct', 'embedded']),
  category: z.string().optional(),
  is_visible: z.boolean().default(true),
  allowed_roles: z.array(z.string()).default(['all']),
  order_index: z.number().default(0),
});

export const documentFormSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  file_path: z.string().min(1, 'مسار الملف مطلوب'),
  file_type: z.string().min(1, 'نوع الملف مطلوب'),
  file_size: z.number().positive().optional(),
});

export const projectFormSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  deliverables: z.string().optional(),
  due_date: z.string().optional(),
  max_points: z.number().positive().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const examFormSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  time_limit: z.number().positive('الحد الزمني يجب أن يكون أكبر من صفر').optional(),
  exam_type: z.enum(['quiz', 'midterm', 'final', 'practice']).default('quiz'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  attempts_allowed: z.number().positive().default(1),
  questions: z.array(z.object({
    question_text: z.string().min(1, 'نص السؤال مطلوب'),
    question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay', 'code']),
    choices: z.array(z.string()).optional(),
    correct_answer: z.string().optional(),
    points: z.number().positive('النقاط يجب أن تكون أكبر من صفر'),
    explanation: z.string().optional(),
    difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  })),
});

export const grade11SectionSchema = z.object({
  title: z.string().min(1, 'عنوان القسم مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  order_index: z.number().default(0),
});

export const grade11TopicSchema = z.object({
  section_id: z.string().min(1, 'معرف القسم مطلوب'),
  title: z.string().min(1, 'عنوان الموضوع مطلوب').max(200, 'العنوان طويل جداً'),
  content: z.string().optional(),
  order_index: z.number().default(0),
});

export const grade11LessonSchema = z.object({
  topic_id: z.string().min(1, 'معرف الموضوع مطلوب'),
  title: z.string().min(1, 'عنوان الدرس مطلوب').max(200, 'العنوان طويل جداً'),
  content: z.string().optional(),
  order_index: z.number().default(0),
});

// أنواع TypeScript للنماذج
export type VideoFormData = z.infer<typeof videoFormSchema>;
export type DocumentFormData = z.infer<typeof documentFormSchema>;
export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type ExamFormData = z.infer<typeof examFormSchema>;
export type Grade11SectionFormData = z.infer<typeof grade11SectionSchema>;
export type Grade11TopicFormData = z.infer<typeof grade11TopicSchema>;
export type Grade11LessonFormData = z.infer<typeof grade11LessonSchema>;

// أنواع حالات النماذج
export interface FormState<T = unknown> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface FormActions<T = unknown> {
  setData: (data: Partial<T>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
  validate: () => boolean;
}

// أنواع المحتوى المشترك للنماذج
export interface FormProps<T = unknown> {
  data?: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
}

// أنواع التحميل والرفع
export interface FileUploadState {
  file?: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export interface BulkUploadState {
  files: FileUploadState[];
  totalProgress: number;
  completed: number;
  failed: number;
  processing: boolean;
}