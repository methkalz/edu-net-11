/**
 * Data Validation Schemas and Utilities
 * 
 * Comprehensive validation system for the educational platform using Zod.
 * Provides type-safe validation schemas for all data inputs, forms, and API endpoints.
 * Includes Arabic error messages for better user experience.
 * 
 * Features:
 * - Form validation schemas for authentication, schools, students, etc.
 * - Content validation for educational materials
 * - File upload validation with size and type checking
 * - Input sanitization to prevent XSS attacks
 * - TypeScript type inference from schemas
 * - Utility functions for common validation tasks
 * 
 * Usage:
 * - Import schemas for form validation with React Hook Form
 * - Use utility functions for inline validation
 * - Leverage TypeScript types derived from schemas
 * 
 * @example
 * // Form validation
 * const { data, error } = signInSchema.safeParse(formData);
 * 
 * // Utility validation
 * if (!validateEmail(email)) {
 *   throw new Error('Invalid email format');
 * }
 * 
 * // Type inference
 * type SignInFormData = z.infer<typeof signInSchema>;
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { z } from 'zod';

// Basic validation schemas with Arabic error messages
/** Email validation with Arabic error message */
export const emailSchema = z.string().email('البريد الإلكتروني غير صحيح');

/** Password validation requiring minimum 8 characters */
export const passwordSchema = z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');

/** Phone number validation with international format support */
export const phoneSchema = z.string().regex(/^[0-9+\-\s()]+$/, 'رقم الهاتف غير صحيح');

/** Name validation with length constraints */
export const nameSchema = z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً');

// Authentication validation schemas
/** Sign-in form validation requiring email and password */
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Sign-up form validation including full name */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
});

// مخططات المدرسة
export const schoolSchema = z.object({
  name: nameSchema,
  city: z.string().min(1, 'المدينة مطلوبة'),
  address: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  plan: z.enum(['free', 'premium', 'enterprise']).default('free'),
});

export const schoolAdminSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: nameSchema,
  school_name: nameSchema,
  city: z.string().min(1, 'المدينة مطلوبة'),
  package_id: z.string().uuid().optional(),
  is_primary_admin: z.boolean().default(true),
});

// مخططات الطالب
export const studentSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  parent_name: z.string().optional(),
  parent_phone: phoneSchema.optional(),
  parent_email: emailSchema.optional(),
  class_id: z.string().uuid().optional(),
});

export const bulkStudentSchema = z.array(studentSchema);

// مخططات الصف
export const classSchema = z.object({
  class_name_id: z.string().uuid('معرف اسم الصف غير صحيح'),
  grade_level_id: z.string().uuid('معرف مستوى الصف غير صحيح'),
  academic_year_id: z.string().uuid('معرف السنة الدراسية غير صحيح'),
  school_id: z.string().uuid('معرف المدرسة غير صحيح'),
});

export const classNameSchema = z.object({
  name: nameSchema,
  school_id: z.string().uuid('معرف المدرسة غير صحيح'),
});

// مخططات المحتوى التعليمي
export const videoContentSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  url: z.string().url('رابط الفيديو غير صحيح'),
  duration: z.number().positive().optional(),
  thumbnail: z.string().url().optional(),
  grade_level: z.string().min(1, 'مستوى الصف مطلوب'),
  course_id: z.string().uuid().optional(),
});

export const documentContentSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  file_url: z.string().url('رابط الملف غير صحيح'),
  file_type: z.string().min(1, 'نوع الملف مطلوب'),
  grade_level: z.string().min(1, 'مستوى الصف مطلوب'),
  course_id: z.string().uuid().optional(),
});

export const examQuestionSchema = z.object({
  question_text: z.string().min(1, 'نص السؤال مطلوب'),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  choices: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  points: z.number().positive('النقاط يجب أن تكون أكبر من صفر'),
});

export const examContentSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  questions: z.array(examQuestionSchema).min(1, 'يجب إضافة سؤال واحد على الأقل'),
  time_limit: z.number().positive().optional(),
  total_points: z.number().positive('مجموع النقاط يجب أن يكون أكبر من صفر'),
  grade_level: z.string().min(1, 'مستوى الصف مطلوب'),
  course_id: z.string().uuid().optional(),
});

export const lessonContentSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  content: z.string().min(1, 'محتوى الدرس مطلوب'),
  media: z.object({
    images: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string().url(),
      type: z.string(),
      size: z.number().optional(),
    })).default([]),
    animations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string().url(),
      type: z.string(),
      size: z.number().optional(),
    })).default([]),
    lottieFiles: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string().url(),
      type: z.string(),
      size: z.number().optional(),
    })).default([]),
  }).default({ images: [], animations: [], lottieFiles: [] }),
  grade_level: z.string().min(1, 'مستوى الصف مطلوب'),
  course_id: z.string().uuid().optional(),
});

export const projectContentSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  requirements: z.string().min(1, 'متطلبات المشروع مطلوبة'),
  deliverables: z.string().min(1, 'مخرجات المشروع مطلوبة'),
  grade_level: z.string().min(1, 'مستوى الصف مطلوب'),
  course_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
});

// مخططات التقويم والأحداث
export const calendarEventSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  date: z.string().min(1, 'التاريخ مطلوب'),
  time: z.string().optional(),
  is_active: z.boolean().default(true),
  event_type: z.enum(['exam', 'holiday', 'meeting', 'deadline', 'other']).default('other'),
});

// مخططات المعلم
export const teacherSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(1, 'المادة مطلوبة'),
  qualifications: z.string().optional(),
  hire_date: z.string().optional(),
});

// مخططات السنة الدراسية
export const academicYearSchema = z.object({
  name: nameSchema,
  start_at_utc: z.string().min(1, 'تاريخ البداية مطلوب'),
  end_at_utc: z.string().min(1, 'تاريخ النهاية مطلوب'),
  granularity: z.enum(['semester', 'quarter', 'trimester']).default('semester'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

// مخططات الباقة
export const packageSchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  duration_months: z.number().positive('مدة الباقة يجب أن تكون أكبر من صفر'),
  max_schools: z.number().positive().optional(),
  max_students: z.number().positive().optional(),
  features: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  available_grade_contents: z.array(z.enum(['grade10', 'grade11', 'grade12'])).default([]),
});

// مخططات الإضافة
export const pluginSchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  version: z.string().min(1, 'إصدار الإضافة مطلوب'),
  author: z.string().optional(),
  is_active: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).optional(),
});

// مخططات الملف
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'ملف غير صحيح' }),
  maxSize: z.number().positive().default(10 * 1024 * 1024), // 10MB
  allowedTypes: z.array(z.string()).default(['image/*', 'application/pdf', 'text/*']),
});

// دوال مساعدة للتحقق
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function validateFileSize(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
  return file.size <= maxSize;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
}

// أنواع TypeScript المستخرجة من المخططات
export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SchoolData = z.infer<typeof schoolSchema>;
export type SchoolAdminData = z.infer<typeof schoolAdminSchema>;
export type StudentData = z.infer<typeof studentSchema>;
export type ClassData = z.infer<typeof classSchema>;
export type VideoContentData = z.infer<typeof videoContentSchema>;
export type DocumentContentData = z.infer<typeof documentContentSchema>;
export type ExamContentData = z.infer<typeof examContentSchema>;
export type LessonContentData = z.infer<typeof lessonContentSchema>;
export type ProjectContentData = z.infer<typeof projectContentSchema>;
export type CalendarEventData = z.infer<typeof calendarEventSchema>;
export type TeacherData = z.infer<typeof teacherSchema>;
export type AcademicYearData = z.infer<typeof academicYearSchema>;
export type PackageData = z.infer<typeof packageSchema>;
export type PluginData = z.infer<typeof pluginSchema>;