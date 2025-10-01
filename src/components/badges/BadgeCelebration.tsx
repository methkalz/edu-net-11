import React, { useEffect, useState } from 'react';
import { Badge as BadgeType } from '@/types/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCelebrationMusic } from '@/hooks/useCelebrationMusic';
import './BadgeCelebration.css';

interface BadgeCelebrationProps {
  badge: BadgeType;
  studentName?: string;
  onClose: () => void;
}

export const BadgeCelebration: React.FC<BadgeCelebrationProps> = ({
  badge,
  studentName,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);
  const { stopMusic } = useCelebrationMusic();

  useEffect(() => {
    // إنشاء جسيمات الاحتفال
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB'][Math.floor(Math.random() * 5)]
    }));
    setConfettiParticles(particles);

    // عداد تنازلي
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopMusic();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopMusic();
    };
  }, [onClose, stopMusic]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiParticles.map((particle) => (
          <div
            key={particle.id}
            className="confetti-particle absolute w-3 h-3 rounded-full"
            style={{
              left: `${particle.left}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
              boxShadow: `0 0 10px ${particle.color}`
            }}
          />
        ))}
      </div>

      {/* Main celebration card */}
      <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-950/30 dark:via-orange-950/30 dark:to-amber-950/30 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in border-4 border-yellow-400/50">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10"
          onClick={() => {
            stopMusic();
            onClose();
          }}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Timer countdown */}
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/40 rounded-full px-3 py-1 text-sm font-bold">
          {timeLeft}s
        </div>

        {/* Glowing background effects */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="glow-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl" />
          <div className="glow-pulse-delayed absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-400/30 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <h2 className="text-2xl font-bold">مبروك</h2>
            </div>
            {studentName && (
              <p className="text-lg font-medium text-muted-foreground text-center">
                {studentName}
              </p>
            )}
          </div>

          {/* Badge display with rotation and glow */}
          <div className="relative py-8">
            <div className="badge-display relative mx-auto w-40 h-40">
              <img
                src={badge.image}
                alt={badge.name}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
            
            {/* Rotating light rays */}
            <div className="light-rays absolute inset-0 pointer-events-none" />
          </div>

          {/* Badge info */}
          <div className="space-y-3">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 bg-clip-text text-transparent text-center">
              وسام {badge.name}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
              <span>حصلت على هذا الوسام بتجاوز {badge.minPoints} نقطة!</span>
            </div>
          </div>

          {/* Action button */}
          <Button
            onClick={() => {
              stopMusic();
              onClose();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
          >
            متابعة التعلم 🚀
          </Button>
        </div>
      </div>
    </div>
  );
};
