import React, { useState, useEffect } from 'react';
import { Clock, Heart } from 'lucide-react';
interface CountdownTimerProps {
  targetDate: Date;
}
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
        const minutes = Math.floor(distance % (1000 * 60 * 60) / (1000 * 60));
        const seconds = Math.floor(distance % (1000 * 60) / 1000);
        setTimeLeft({
          days,
          hours,
          minutes,
          seconds
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  const TimeUnit: React.FC<{
    value: number;
    label: string;
  }> = ({
    value,
    label
  }) => <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center">
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-2 font-mono text-center">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600 font-medium text-center">{label}</div>
      </div>
    </div>;
  return <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-8 rounded-3xl border border-blue-200 mb-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">احصل على التجربة المجانية الآن</h3>
        </div>
        
      </div>
      
      <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
        <TimeUnit value={timeLeft.days} label="يوم" />
        <TimeUnit value={timeLeft.hours} label="ساعة" />
        <TimeUnit value={timeLeft.minutes} label="دقيقة" />
        <TimeUnit value={timeLeft.seconds} label="ثانية" />
      </div>
      
      <div className="text-center mt-6">
        <div className="inline-flex items-center gap-2 text-red-600 font-medium animate-pulse">
          <Heart className="h-4 w-4" />
          <span>نسخة مجانية كاملة المواصفات والإضافات الرائعة</span>
          <Heart className="h-4 w-4" />
        </div>
      </div>
    </div>;
};
export default CountdownTimer;