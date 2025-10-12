// Hook لإدارة العد التنازلي للامتحان
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logging';

interface UseExamTimerOptions {
  durationMinutes: number;
  onTimeUp?: () => void;
  startImmediately?: boolean;
}

export const useExamTimer = ({ durationMinutes, onTimeUp, startImmediately = true }: UseExamTimerOptions) => {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
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
    setRemainingSeconds(durationMinutes * 60);
    setIsTimeUp(false);
    logger.debug('تم إعادة تعيين مؤقت الامتحان');
  }, [durationMinutes, stop]);

  // العد التنازلي
  useEffect(() => {
    if (isRunning && !isTimeUp) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsTimeUp(true);
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            logger.warn('انتهى وقت الامتحان');
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isTimeUp, onTimeUp]);

  // إعادة تعيين الوقت المتبقي عند تغيير المدة
  useEffect(() => {
    setRemainingSeconds(durationMinutes * 60);
    logger.debug('تم تحديث مدة الامتحان', { durationMinutes });
  }, [durationMinutes]);

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
