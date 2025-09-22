import { useState, useEffect, useCallback } from 'react';
import { gameLogger, GameLogEntry } from '@/lib/game-logger';
import { useAuth } from '@/hooks/useAuth';

export const useGameLogger = () => {
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const { user } = useAuth();

  // تحديث السجلات عند تغييرها
  useEffect(() => {
    const handleLogsUpdate = (updatedLogs: GameLogEntry[]) => {
      setLogs(updatedLogs);
    };

    gameLogger.addListener(handleLogsUpdate);
    
    // جلب السجلات الحالية
    setLogs(gameLogger.getLogs());

    return () => {
      gameLogger.removeListener(handleLogsUpdate);
    };
  }, []);

  // بدء جلسة تسجيل
  const startLogging = useCallback((sessionId: string, lessonId?: string) => {
    setIsLogging(true);
    gameLogger.startSession(sessionId, user?.id, lessonId);
    gameLogger.log('info', 'system', 'logging_started', {
      userId: user?.id,
      sessionId,
      lessonId
    });
  }, [user?.id]);

  // إنهاء جلسة التسجيل
  const stopLogging = useCallback((finalScore?: number, maxScore?: number) => {
    const sessionReport = gameLogger.endSession(finalScore, maxScore);
    setIsLogging(false);
    return sessionReport;
  }, []);

  // تسجيل إجابة سؤال
  const logAnswer = useCallback((
    questionId: string, 
    question: any, 
    answer: string, 
    isCorrect: boolean, 
    timeSpent: number
  ) => {
    gameLogger.logQuestionAnswer(questionId, question, answer, isCorrect, timeSpent);
  }, []);

  // تسجيل استخدام تلميح
  const logHint = useCallback((questionId: string, hintType: string) => {
    gameLogger.logHintUsed(questionId, hintType);
  }, []);

  // تسجيل تحديث التقدم
  const logProgress = useCallback((
    lessonId: string, 
    oldScore: number, 
    newScore: number, 
    attempts: number
  ) => {
    gameLogger.logProgressUpdate(lessonId, oldScore, newScore, attempts);
  }, []);

  // تسجيل إنجاز
  const logAchievement = useCallback((achievementType: string, achievementData: any) => {
    gameLogger.logAchievementUnlocked(achievementType, achievementData);
  }, []);

  // تسجيل خطأ
  const logError = useCallback((error: Error, context?: any) => {
    gameLogger.logSystemError(error, context);
  }, []);

  // تسجيل مشكلة أداء
  const logPerformance = useCallback((issue: string, details: any) => {
    gameLogger.logPerformanceIssue(issue, details);
  }, []);

  // تسجيل إجراء المستخدم
  const logUserAction = useCallback((action: string, details?: any) => {
    gameLogger.logUserAction(action, details);
  }, []);

  // تسجيل عام
  const log = useCallback((
    level: 'info' | 'warn' | 'error' | 'debug' | 'success',
    category: 'session' | 'question' | 'progress' | 'achievement' | 'system' | 'user_action' | 'performance',
    event: string,
    data: any
  ) => {
    gameLogger.log(level, category, event, data);
  }, []);

  // الحصول على السجلات المصفاة
  const getFilteredLogs = useCallback((filters?: {
    level?: 'info' | 'warn' | 'error' | 'debug' | 'success';
    category?: 'session' | 'question' | 'progress' | 'achievement' | 'system' | 'user_action' | 'performance';
    limit?: number;
  }) => {
    return gameLogger.getLogs(filters);
  }, []);

  // الحصول على المقاييس
  const getMetrics = useCallback(() => {
    return gameLogger.getMetrics();
  }, []);

  // الحصول على تقرير الجلسة
  const getSessionReport = useCallback(() => {
    return gameLogger.getSessionReport();
  }, []);

  // مسح السجلات
  const clearLogs = useCallback(() => {
    gameLogger.clearLogs();
  }, []);

  // تصدير السجلات
  const exportLogs = useCallback(() => {
    return gameLogger.exportLogs();
  }, []);

  return {
    logs,
    isLogging,
    startLogging,
    stopLogging,
    logAnswer,
    logHint,
    logProgress,
    logAchievement,
    logError,
    logPerformance,
    logUserAction,
    log,
    getFilteredLogs,
    getMetrics,
    getSessionReport,
    clearLogs,
    exportLogs
  };
};