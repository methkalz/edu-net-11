import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExamTimerProps {
  durationMinutes: number;
  startTime: string;
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ 
  durationMinutes, 
  startTime, 
  onTimeUp 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const end = start + (durationMinutes * 60 * 1000);
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(0);
        onTimeUp();
        return 0;
      }

      setTimeLeft(Math.floor(diff / 1000));
      
      // تحذير قبل 5 دقائق من انتهاء الوقت
      if (diff <= 5 * 60 * 1000 && diff > 4 * 60 * 1000 && !showWarning) {
        setShowWarning(true);
      }

      return diff;
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, startTime, onTimeUp, showWarning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 5 * 60; // آخر 5 دقائق

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-lg font-bold ${
        isLowTime ? 'text-red-600 animate-pulse' : 'text-foreground'
      }`}>
        <Clock className="w-5 h-5" />
        <span>{formatTime(timeLeft)}</span>
      </div>

      {showWarning && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            تبقى 5 دقائق فقط على انتهاء الوقت!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};