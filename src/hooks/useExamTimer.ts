// Hook لإدارة العد التنازلي للامتحان بناءً على وقت البدء الفعلي
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logging';

interface UseExamTimerOptions {
  durationMinutes: number;
  onTimeUp?: () => void;
  startImmediately?: boolean;
  startedAt?: string | null; // وقت بدء المحاولة من قاعدة البيانات
}

export const useExamTimer = ({ durationMinutes, onTimeUp, startImmediately = true, startedAt }: UseExamTimerOptions) => {
  // حساب الوقت المتبقي بناءً على وقت البدء الفعلي
  const calculateRemainingSeconds = useCallback(() => {
    if (!startedAt) {
      return durationMinutes * 60;
    }

    const startTime = new Date(startedAt).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const totalSeconds = durationMinutes * 60;
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);

    return remaining;
  }, [startedAt, durationMinutes]);

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);
  const [isRunning, setIsRunning] = useState(startImmediately);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // إيقاف المؤقت
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    logger.debug('تم إيقاف مؤقت الامتحان');
  }, []);

  // بدء المؤقت
  const start = useCallback(() => {
    if (!intervalRef.current && !isTimeUp) {
      setIsRunning(true);
      logger.debug('تم بدء مؤقت الامتحان');
    }
  }, [isTimeUp]);

  // إعادة تعيين المؤقت
  const reset = useCallback(() => {
    stop();
    setRemainingSeconds(calculateRemainingSeconds());
    setIsTimeUp(false);
    logger.debug('تم إعادة تعيين مؤقت الامتحان');
  }, [calculateRemainingSeconds, stop]);

  // العد التنازلي - يعتمد على الوقت الفعلي من قاعدة البيانات
  useEffect(() => {
    if (isRunning && !isTimeUp) {
      intervalRef.current = setInterval(() => {
        const remaining = calculateRemainingSeconds();
        setRemainingSeconds(remaining);

        if (remaining <= 0) {
          setIsTimeUp(true);
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          logger.warn('انتهى وقت الامتحان');
          onTimeUp?.();
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isTimeUp, onTimeUp, calculateRemainingSeconds]);

  // إعادة حساب الوقت المتبقي عند تغيير startedAt أو durationMinutes
  useEffect(() => {
    const remaining = calculateRemainingSeconds();
    setRemainingSeconds(remaining);
    
    // التحقق إذا كان الوقت قد انتهى بالفعل
    if (remaining <= 0 && !isTimeUp) {
      setIsTimeUp(true);
      setIsRunning(false);
      onTimeUp?.();
    }
  }, [startedAt, durationMinutes, calculateRemainingSeconds, isTimeUp, onTimeUp]);

  // تنظيف عند إلغاء التثبيت
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // تنسيق الوقت المتبقي
  const formatTime = useCallback(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  // التحقق من آخر 5 دقائق
  const isLastFiveMinutes = remainingSeconds <= 300 && remainingSeconds > 0;

  // التحقق من آخر دقيقة
  const isLastMinute = remainingSeconds <= 60 && remainingSeconds > 0;

  return {
    remainingSeconds,
    formattedTime: formatTime(),
    isRunning,
    isTimeUp,
    isLastFiveMinutes,
    isLastMinute,
    start,
    stop,
    reset,
    percentageRemaining: (remainingSeconds / (durationMinutes * 60)) * 100,
  };
};
