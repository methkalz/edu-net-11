// أنواع البيانات لنظام فحص الامتحانات الإلكترونية

export type ExamEventType = 
  | 'COMPONENT_MOUNTED'
  | 'COMPONENT_UNMOUNTED'
  | 'EXAM_DATA_LOADED'
  | 'EXAM_DATA_ERROR'
  | 'ATTEMPT_CREATION_STARTED'
  | 'ATTEMPT_CREATED'
  | 'ATTEMPT_CREATION_FAILED'
  | 'ATTEMPT_RESUMED'
  | 'ANSWER_CHANGED'
  | 'ANSWER_SAVED'
  | 'AUTO_SAVE_TRIGGERED'
  | 'AUTO_SAVE_SUCCESS'
  | 'AUTO_SAVE_FAILED'
  | 'SUBMIT_STARTED'
  | 'SUBMIT_VALIDATION_FAILED'
  | 'SUBMIT_UPDATE_STARTED'
  | 'SUBMIT_UPDATE_SUCCESS'
  | 'SUBMIT_UPDATE_FAILED'
  | 'SUBMIT_RPC_STARTED'
  | 'SUBMIT_RPC_SUCCESS'
  | 'SUBMIT_RPC_FAILED'
  | 'SUBMIT_SUCCESS'
  | 'SUBMIT_FAILED'
  | 'SUBMIT_FAILED_NO_ATTEMPT'
  | 'TIMER_STARTED'
  | 'TIMER_WARNING'
  | 'TIMER_EXPIRED'
  | 'NAVIGATION_CHANGED'
  | 'RECOVERY_MODE_ACTIVATED'
  | 'STATE_VALIDATION_PASSED'
  | 'STATE_VALIDATION_FAILED';

export interface ExamEvent {
  type: ExamEventType;
  timestamp?: string;
  sessionId?: string;
  data?: Record<string, any>;
}

export interface ExamDebugState {
  examId?: string;
  attemptId?: string | null;
  examData?: any;
  isLoading?: boolean;
  hasStarted?: boolean;
  answersCount?: number;
  currentQuestionIndex?: number;
  remainingSeconds?: number;
  createMutationStatus?: string;
  submitMutationStatus?: string;
}

export interface ExamDebugReport {
  sessionId: string;
  totalEvents: number;
  events: ExamEvent[];
  summary: {
    totalAttempts: number;
    successfulSubmissions: number;
    failedSubmissions: number;
    validationErrors: number;
    totalAnswersChanged: number;
    autoSaveAttempts: number;
    autoSaveFailures: number;
  };
  timeline: string[];
}

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
}
