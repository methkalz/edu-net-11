import React from 'react';
import Lottie from 'lottie-react';
import { ModernLoader } from './ModernLoader';

interface LottieLoaderProps {
  animationData?: any;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  speed?: number;
  loop?: boolean;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  animationData,
  text = 'Loading...',
  size = 'md',
  className = '',
  speed = 1,
  loop = true
}) => {
  // إذا لم يوجد ملف Lottie، استخدم ModernLoader
  if (!animationData) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <ModernLoader type="gradient" size={size} />
        <div className="text-center">
          <span className={`
            font-medium text-muted-foreground
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}
          `}>
            {text}
          </span>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`${sizeClasses[size]} animate-fade-in`}>
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice'
          }}
        />
      </div>
      {text && (
        <div className="text-center animate-fade-in-up">
          <span className={`
            font-medium text-muted-foreground transition-all duration-300
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}
          `}>
            {text}
          </span>
        </div>
      )}
    </div>
  );
};

export default LottieLoader;