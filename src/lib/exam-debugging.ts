// نظام فحص متقدم للامتحانات الإلكترونية
import { 
  ExamEvent, 
  ExamEventType, 
  ExamDebugState, 
  ExamDebugReport, 
  ValidationIssue 
} from '@/types/exam-debug';

export class ExamDebugger {
  private static isDevelopment = import.meta.env.DEV;
  private static sessionId = crypto.randomUUID();
  private static events: ExamEvent[] = [];
  private static maxEvents = 1000; // حد أقصى للأحداث المحفوظة

  /**
   * تسجيل حدث في نظام التتبع
   */
  static log(event: Omit<ExamEvent, 'timestamp' | 'sessionId'>) {
    if (!this.isDevelopment) return;
    
    const timestamp = new Date().toISOString();
    const fullEvent: ExamEvent = { 
      ...event, 
      timestamp, 
      sessionId: this.sessionId 
    };
    
    // إضافة الحدث مع الحد الأقصى
    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // إزالة أقدم حدث
    }
    
    // طباعة ملونة في الكونسول
    const emoji = this.getEventEmoji(event.type);
    const color = this.getEventColor(event.type);
    
    console.log(
      `%c${emoji} [EXAM_DEBUG] ${event.type}`,
      `color: ${color}; font-weight: bold; font-size: 12px;`,
      {
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        data: fullEvent.data
      }
    );
  }

  /**
   * فحص حالة النظام والتحقق من وجود مشاكل
   */
  static validateState(component: string, state: ExamDebugState): ValidationIssue[] {
    if (!this.isDevelopment) return [];
    
    const issues: ValidationIssue[] = [];
    
    // فحوصات مخصصة حسب المكون
    if (component === 'StudentExamAttempt') {
      // فحص attemptId
      if (!state.attemptId && state.hasStarted) {
        issues.push({
          field: 'attemptId',
          issue: 'attemptId is null after exam started',
          severity: 'error'
        });
      }
      
      // فحص examData
      if (!state.examData && !state.isLoading) {
        issues.push({
          field: 'examData',
          issue: 'examData is missing and not loading',
          severity: 'error'
        });
      }
      
      // فحص تناسق البيانات
      if (state.attemptId && !state.examData) {
        issues.push({
          field: 'examData',
          issue: 'attemptId exists but examData is missing',
          severity: 'warning'
        });
      }
      
      // فحص الإجابات
      if (state.hasStarted && state.answersCount === 0 && state.currentQuestionIndex > 0) {
        issues.push({
          field: 'answers',
          issue: 'Student navigated but no answers recorded',
          severity: 'info'
        });
      }
      
      // فحص حالة mutations
      if (state.createMutationStatus === 'error' && !state.attemptId) {
        issues.push({
          field: 'createMutation',
          issue: 'Attempt creation failed and no retry',
          severity: 'error'
        });
      }
    }
    
    // تسجيل النتائج
    if (issues.length > 0) {
      console.error(
        '%c⚠️ [EXAM_DEBUG] VALIDATION FAILED',
        'color: #ff0000; font-weight: bold; font-size: 14px; background: #ffe0e0; padding: 4px;',
        {
          component,
          state,
          issues,
          timestamp: new Date().toLocaleTimeString('ar-EG')
        }
      );
      
      this.log({
        type: 'STATE_VALIDATION_FAILED',
        data: { component, state, issues }
      });
    } else {
      this.log({
        type: 'STATE_VALIDATION_PASSED',
        data: { component }
      });
    }
    
    return issues;
  }

  /**
   * الحصول على تقرير كامل بالأحداث
   */
  static getReport(): ExamDebugReport {
    const summary = this.generateSummary();
    const timeline = this.generateTimeline();
    
    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      events: this.events,
      summary,
      timeline
    };
  }

  /**
   * توليد ملخص إحصائي
   */
  private static generateSummary() {
    return {
      totalAttempts: this.events.filter(e => 
        e.type === 'ATTEMPT_CREATION_STARTED'
      ).length,
      successfulSubmissions: this.events.filter(e => 
        e.type === 'SUBMIT_SUCCESS'
      ).length,
      failedSubmissions: this.events.filter(e => 
        e.type === 'SUBMIT_FAILED' || e.type === 'SUBMIT_FAILED_NO_ATTEMPT'
      ).length,
      validationErrors: this.events.filter(e => 
        e.type === 'STATE_VALIDATION_FAILED'
      ).length,
      totalAnswersChanged: this.events.filter(e => 
        e.type === 'ANSWER_CHANGED'
      ).length,
      autoSaveAttempts: this.events.filter(e => 
        e.type === 'AUTO_SAVE_TRIGGERED'
      ).length,
      autoSaveFailures: this.events.filter(e => 
        e.type === 'AUTO_SAVE_FAILED'
      ).length
    };
  }

  /**
   * توليد خط زمني للأحداث
   */
  private static generateTimeline(): string[] {
    return this.events.map(e => 
      `[${e.timestamp}] ${e.type}${e.data ? ': ' + JSON.stringify(e.data).substring(0, 50) : ''}`
    );
  }

  /**
   * تصدير التقرير كملف JSON
   */
  static exportReport(): void {
    if (!this.isDevelopment) return;
    
    const report = this.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(
      '%c📊 [EXAM_DEBUG] Report Exported',
      'color: #00ff00; font-weight: bold; font-size: 14px;',
      report
    );
  }

  /**
   * مسح جميع الأحداث
   */
  static clear(): void {
    this.events = [];
    console.log(
      '%c🗑️ [EXAM_DEBUG] Events Cleared',
      'color: #ffaa00; font-weight: bold;'
    );
  }

  /**
   * الحصول على emoji للحدث
   */
  private static getEventEmoji(type: ExamEventType): string {
    const emojiMap: Record<ExamEventType, string> = {
      'COMPONENT_MOUNTED': '🎬',
      'COMPONENT_UNMOUNTED': '🛑',
      'EXAM_DATA_LOADED': '📚',
      'EXAM_DATA_ERROR': '❌',
      'ATTEMPT_CREATION_STARTED': '🚀',
      'ATTEMPT_CREATED': '✅',
      'ATTEMPT_CREATION_FAILED': '💥',
      'ATTEMPT_RESUMED': '🔄',
      'ANSWER_CHANGED': '✏️',
      'ANSWER_SAVED': '💾',
      'AUTO_SAVE_TRIGGERED': '⏰',
      'AUTO_SAVE_SUCCESS': '✅',
      'AUTO_SAVE_FAILED': '⚠️',
      'SUBMIT_STARTED': '📤',
      'SUBMIT_VALIDATION_FAILED': '🚫',
      'SUBMIT_UPDATE_STARTED': '🔄',
      'SUBMIT_UPDATE_SUCCESS': '✅',
      'SUBMIT_UPDATE_FAILED': '❌',
      'SUBMIT_RPC_STARTED': '📡',
      'SUBMIT_RPC_SUCCESS': '✅',
      'SUBMIT_RPC_FAILED': '💥',
      'SUBMIT_SUCCESS': '🎉',
      'SUBMIT_FAILED': '❌',
      'SUBMIT_FAILED_NO_ATTEMPT': '🚨',
      'TIMER_STARTED': '⏱️',
      'TIMER_WARNING': '⚠️',
      'TIMER_EXPIRED': '⏰',
      'NAVIGATION_CHANGED': '🧭',
      'RECOVERY_MODE_ACTIVATED': '🆘',
      'STATE_VALIDATION_PASSED': '✅',
      'STATE_VALIDATION_FAILED': '⚠️'
    };
    return emojiMap[type] || '🔹';
  }

  /**
   * الحصول على لون للحدث
   */
  private static getEventColor(type: ExamEventType): string {
    if (type.includes('SUCCESS') || type.includes('CREATED') || type === 'STATE_VALIDATION_PASSED') {
      return '#00ff00';
    }
    if (type.includes('FAILED') || type.includes('ERROR')) {
      return '#ff0000';
    }
    if (type.includes('WARNING') || type === 'STATE_VALIDATION_FAILED') {
      return '#ffaa00';
    }
    if (type.includes('STARTED') || type.includes('TRIGGERED')) {
      return '#00aaff';
    }
    return '#aaaaaa';
  }

  /**
   * التحقق من وجود مشاكل حرجة
   */
  static hasCriticalIssues(): boolean {
    const criticalEvents: ExamEventType[] = [
      'SUBMIT_FAILED_NO_ATTEMPT',
      'ATTEMPT_CREATION_FAILED',
      'EXAM_DATA_ERROR'
    ];
    
    return this.events.some(e => criticalEvents.includes(e.type));
  }

  /**
   * الحصول على آخر خطأ
   */
  static getLastError(): ExamEvent | null {
    const errorEvents = this.events.filter(e => 
      e.type.includes('FAILED') || e.type.includes('ERROR')
    );
    return errorEvents.length > 0 ? errorEvents[errorEvents.length - 1] : null;
  }
}
