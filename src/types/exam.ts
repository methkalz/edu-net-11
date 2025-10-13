// أنواع نظام الامتحانات الإلكترونية
import { Database } from "@/integrations/supabase/types";

export type QuestionType = Database['public']['Enums']['question_type'];
export type QuestionDifficulty = Database['public']['Enums']['question_difficulty'];
export type ExamStatus = Database['public']['Enums']['exam_status'];
export type AttemptStatus = Database['public']['Enums']['attempt_status'];

export interface QuestionChoice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  choices?: QuestionChoice[];
  correct_answer: string;
  points: number;
  difficulty: QuestionDifficulty;
  grade_level: string;
  section_name?: string;
  topic_name?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherCustomQuestion extends Omit<Question, 'section_name' | 'topic_name'> {
  teacher_id: string;
  school_id: string;
  tags: string[];
  category?: string; // تصنيف/مجموعة السؤال
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  school_id: string;
  grade_levels: string[];
  target_classes?: string[];
  total_questions: number;
  total_points: number;
  passing_percentage: number;
  duration_minutes: number;
  start_datetime: string;
  end_datetime: string;
  max_attempts: number;
  show_results_immediately: boolean;
  shuffle_questions: boolean;
  shuffle_choices: boolean;
  allow_review: boolean;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  question_sources?: string[]; // مصادر الأسئلة المتعددة
  source_distribution?: Record<string, number>; // توزيع الأسئلة حسب المصدر
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_source: 'bank' | 'custom';
  question_bank_id?: string;
  custom_question_id?: string;
  question_order: number;
  points_override?: number;
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  school_id: string;
  attempt_number: number;
  status: AttemptStatus;
  started_at: string;
  submitted_at?: string;
  time_spent_seconds: number;
  questions_data: any;
  answers: Record<string, { answer: string; time_spent?: number }>;
  score?: number;
  percentage?: number;
  passed?: boolean;
  detailed_results?: {
    correct_count: number;
    incorrect_count: number;
    total_questions: number;
    by_section?: Record<string, { correct: number; total: number }>;
    by_difficulty?: Record<string, { correct: number; total: number }>;
  };
  created_at: string;
  updated_at: string;
}

export interface ExamAnalytics {
  id: string;
  exam_id: string;
  total_attempts: number;
  avg_score?: number;
  avg_time_spent?: number;
  pass_rate?: number;
  question_stats: Record<string, {
    correct_count: number;
    incorrect_count: number;
    skip_count: number;
  }>;
  updated_at: string;
}

export interface AvailableExam extends Exam {
  attempts_used: number;
  attempts_remaining: number;
  can_start: boolean;
}

export interface ExamWithQuestions {
  exam: Exam;
  questions: Array<{
    id: string;
    question_order: number;
    points: number;
    question_text: string;
    question_type: QuestionType;
    choices?: QuestionChoice[];
  }>;
}

export interface ExamResult {
  attempt_id: string;
  exam_title: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  time_spent_seconds: number;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  passing_percentage: number;
  detailed_results: ExamAttempt['detailed_results'];
  can_review: boolean;
  show_correct_answers: boolean;
  show_results_immediately: boolean;
  teacher_name?: string;
}
