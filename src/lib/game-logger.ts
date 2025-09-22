// نظام تسجيل شامل للعبة Grade 11
interface GameLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  category: 'session' | 'question' | 'progress' | 'achievement' | 'system' | 'user_action' | 'performance';
  event: string;
  data: any;
  userId?: string;
  sessionId?: string;
  lessonId?: string;
  questionId?: string;
  metadata?: Record<string, any>;
}

interface GameMetrics {
  sessionStartTime?: Date;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  hintsUsed: number;
  timePerQuestion: number[];
  difficultyDistribution: Record<string, number>;
  userActions: Array<{action: string, timestamp: Date}>;
  errorCount: number;
  performanceIssues: string[];
}

class GameLogger {
  private logs: GameLogEntry[] = [];
  private metrics: GameMetrics = {
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    hintsUsed: 0,
    timePerQuestion: [],
    difficultyDistribution: {},
    userActions: [],
    errorCount: 0,
    performanceIssues: []
  };
  private maxLogs = 1000; // الحد الأقصى للسجلات المحفوظة
  private currentSessionId?: string;
  private listeners: Array<(logs: GameLogEntry[]) => void> = [];

  // إضافة مستمع للتحديثات
  addListener(callback: (logs: GameLogEntry[]) => void) {
    this.listeners.push(callback);
  }

  // إزالة مستمع
  removeListener(callback: (logs: GameLogEntry[]) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // تنبيه المستمعين
  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.logs]));
  }

  // بدء جلسة جديدة
  startSession(sessionId: string, userId?: string, lessonId?: string) {
    this.currentSessionId = sessionId;
    this.metrics.sessionStartTime = new Date();
    
    this.log('info', 'session', 'session_started', {
      sessionId,
      userId,
      lessonId,
      startTime: this.metrics.sessionStartTime
    }, { sessionId, userId, lessonId });
  }

  // إنهاء الجلسة
  endSession(finalScore?: number, maxScore?: number) {
    const sessionDuration = this.metrics.sessionStartTime 
      ? Date.now() - this.metrics.sessionStartTime.getTime()
      : 0;

    const summary = {
      sessionId: this.currentSessionId,
      duration: sessionDuration,
      totalQuestions: this.metrics.totalQuestions,
      correctAnswers: this.metrics.correctAnswers,
      wrongAnswers: this.metrics.wrongAnswers,
      accuracy: this.metrics.totalQuestions > 0 
        ? (this.metrics.correctAnswers / this.metrics.totalQuestions) * 100 
        : 0,
      hintsUsed: this.metrics.hintsUsed,
      averageTimePerQuestion: this.metrics.timePerQuestion.length > 0
        ? this.metrics.timePerQuestion.reduce((a, b) => a + b, 0) / this.metrics.timePerQuestion.length
        : 0,
      difficultyDistribution: this.metrics.difficultyDistribution,
      finalScore,
      maxScore,
      errorCount: this.metrics.errorCount,
      performanceIssues: this.metrics.performanceIssues,
      userActions: this.metrics.userActions.length
    };

    this.log('info', 'session', 'session_ended', summary);
    
    // إعادة تعيين المقاييس للجلسة التالية
    this.resetMetrics();
    this.currentSessionId = undefined;
    
    return summary;
  }

  // تسجيل إجابة سؤال
  logQuestionAnswer(questionId: string, question: any, answer: string, isCorrect: boolean, timeSpent: number) {
    this.metrics.totalQuestions++;
    this.metrics.timePerQuestion.push(timeSpent);
    
    if (isCorrect) {
      this.metrics.correctAnswers++;
    } else {
      this.metrics.wrongAnswers++;
    }

    // تسجيل توزيع الصعوبة
    const difficulty = question.difficulty_level || 'unknown';
    this.metrics.difficultyDistribution[difficulty] = 
      (this.metrics.difficultyDistribution[difficulty] || 0) + 1;

    this.log('info', 'question', 'answer_submitted', {
      questionId,
      answer,
      correctAnswer: question.correct_answer,
      isCorrect,
      timeSpent,
      difficulty,
      points: question.points,
      questionType: question.question_type
    }, { 
      sessionId: this.currentSessionId,
      questionId,
      lessonId: question.lesson_id 
    });
  }

  // تسجيل استخدام تلميح
  logHintUsed(questionId: string, hintType: string) {
    this.metrics.hintsUsed++;
    this.metrics.userActions.push({
      action: `hint_used_${hintType}`,
      timestamp: new Date()
    });

    this.log('info', 'user_action', 'hint_used', {
      questionId,
      hintType,
      totalHintsUsed: this.metrics.hintsUsed
    }, { 
      sessionId: this.currentSessionId,
      questionId 
    });
  }

  // تسجيل تحديث التقدم
  logProgressUpdate(lessonId: string, oldScore: number, newScore: number, attempts: number) {
    this.log('info', 'progress', 'progress_updated', {
      lessonId,
      oldScore,
      newScore,
      scoreImprovement: newScore - oldScore,
      attempts,
      timestamp: new Date()
    }, { 
      sessionId: this.currentSessionId,
      lessonId 
    });
  }

  // تسجيل إنجاز جديد
  logAchievementUnlocked(achievementType: string, achievementData: any) {
    this.log('success', 'achievement', 'achievement_unlocked', {
      achievementType,
      achievementData,
      timestamp: new Date()
    }, { 
      sessionId: this.currentSessionId 
    });
  }

  // تسجيل خطأ في النظام
  logSystemError(error: Error, context?: any) {
    this.metrics.errorCount++;
    
    this.log('error', 'system', 'system_error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    }, { 
      sessionId: this.currentSessionId 
    });
  }

  // تسجيل مشكلة في الأداء
  logPerformanceIssue(issue: string, details: any) {
    this.metrics.performanceIssues.push(issue);
    
    this.log('warn', 'performance', 'performance_issue', {
      issue,
      details,
      timestamp: new Date()
    }, { 
      sessionId: this.currentSessionId 
    });
  }

  // تسجيل إجراء المستخدم
  logUserAction(action: string, details?: any) {
    this.metrics.userActions.push({
      action,
      timestamp: new Date()
    });

    this.log('debug', 'user_action', action, {
      details,
      timestamp: new Date()
    }, { 
      sessionId: this.currentSessionId 
    });
  }

  // تسجيل عام
  log(
    level: GameLogEntry['level'], 
    category: GameLogEntry['category'], 
    event: string, 
    data: any, 
    metadata?: Record<string, any>
  ) {
    const logEntry: GameLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      event,
      data,
      sessionId: this.currentSessionId,
      metadata
    };

    this.logs.unshift(logEntry); // إضافة في البداية

    // إبقاء عدد السجلات محدود
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // طباعة في وحدة التحكم للتطوير
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GAME] ${level.toUpperCase()} - ${category}:${event}`, data);
    }

    // تنبيه المستمعين
    this.notifyListeners();
  }

  // الحصول على السجلات
  getLogs(filters?: {
    level?: GameLogEntry['level'];
    category?: GameLogEntry['category'];
    sessionId?: string;
    lessonId?: string;
    limit?: number;
  }) {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      if (filters.sessionId) {
        filteredLogs = filteredLogs.filter(log => log.sessionId === filters.sessionId);
      }
      if (filters.lessonId) {
        filteredLogs = filteredLogs.filter(log => log.lessonId === filters.lessonId);
      }
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }
    }

    return filteredLogs;
  }

  // الحصول على المقاييس
  getMetrics() {
    return { ...this.metrics };
  }

  // الحصول على تقرير الجلسة
  getSessionReport() {
    const currentTime = Date.now();
    const sessionDuration = this.metrics.sessionStartTime 
      ? currentTime - this.metrics.sessionStartTime.getTime()
      : 0;

    return {
      sessionId: this.currentSessionId,
      duration: sessionDuration,
      metrics: this.getMetrics(),
      recentLogs: this.getLogs({ limit: 20 }),
      summary: {
        questionsAnswered: this.metrics.totalQuestions,
        accuracy: this.metrics.totalQuestions > 0 
          ? (this.metrics.correctAnswers / this.metrics.totalQuestions) * 100 
          : 0,
        averageTime: this.metrics.timePerQuestion.length > 0
          ? this.metrics.timePerQuestion.reduce((a, b) => a + b, 0) / this.metrics.timePerQuestion.length
          : 0,
        errorsEncountered: this.metrics.errorCount,
        hintsUsed: this.metrics.hintsUsed
      }
    };
  }

  // مسح السجلات
  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  // إعادة تعيين المقاييس
  private resetMetrics() {
    this.metrics = {
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      hintsUsed: 0,
      timePerQuestion: [],
      difficultyDistribution: {},
      userActions: [],
      errorCount: 0,
      performanceIssues: []
    };
  }

  // تصدير السجلات كـ JSON
  exportLogs() {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// إنشاء مثيل واحد للاستخدام في التطبيق
export const gameLogger = new GameLogger();

// أنواع للتصدير
export type { GameLogEntry, GameMetrics };