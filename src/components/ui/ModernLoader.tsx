import { FC } from 'react';

interface ModernLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'circle' | 'pulse' | 'wave' | 'dots' | 'gradient';
  className?: string;
}

export const ModernLoader: FC<ModernLoaderProps> = ({
  size = 'md',
  type = 'circle',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const baseClass = `${sizeClasses[size]} ${className}`;

  switch (type) {
    case 'circle':
      return (
        <div className={`${baseClass} relative`}>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-modern-spin"></div>
        </div>
      );

    case 'pulse':
      return (
        <div className={`${baseClass} relative flex items-center justify-center`}>
          <div className="absolute inset-0 rounded-full bg-primary animate-modern-pulse"></div>
          <div className="absolute inset-2 rounded-full bg-primary/60 animate-modern-pulse-delay"></div>
          <div className="absolute inset-4 rounded-full bg-primary/30 animate-modern-pulse-slow"></div>
        </div>
      );

    case 'wave':
      return (
        <div className={`${baseClass} flex items-end justify-center space-x-1`}>
          <div className="w-1 bg-primary rounded-full animate-modern-wave-1" style={{ height: '60%' }}></div>
          <div className="w-1 bg-primary rounded-full animate-modern-wave-2" style={{ height: '80%' }}></div>
          <div className="w-1 bg-primary rounded-full animate-modern-wave-3" style={{ height: '100%' }}></div>
          <div className="w-1 bg-primary rounded-full animate-modern-wave-4" style={{ height: '80%' }}></div>
          <div className="w-1 bg-primary rounded-full animate-modern-wave-5" style={{ height: '60%' }}></div>
        </div>
      );

    case 'dots':
      return (
        <div className={`${baseClass} flex items-center justify-center space-x-1`}>
          <div className="w-2 h-2 bg-primary rounded-full animate-modern-bounce-1"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-modern-bounce-2"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-modern-bounce-3"></div>
        </div>
      );

    case 'gradient':
      return (
        <div className={`${baseClass} relative`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-primary/60 to-primary/20 animate-modern-gradient-spin"></div>
          <div className="absolute inset-1 rounded-full bg-background"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 animate-modern-pulse"></div>
        </div>
      );

    default:
      return (
        <div className={`${baseClass} relative`}>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-modern-spin"></div>
        </div>
      );
  }
};

interface LoadingTextProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingText: FC<LoadingTextProps> = ({
  text = 'Loading...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`${sizeClasses[size]} font-medium text-foreground/80 animate-modern-text-fade ${className}`}>
      {text}
      <span className="animate-modern-dots">...</span>
    </div>
  );
};

interface FullLoaderProps {
  type?: 'circle' | 'pulse' | 'wave' | 'dots' | 'gradient';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FullLoader: FC<FullLoaderProps> = ({
  type = 'gradient',
  text = 'Loading...',
  size = 'lg',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <ModernLoader type={type} size={size} />
      <LoadingText text={text} size={size === 'lg' ? 'md' : 'sm'} />
    </div>
  );
};