import React from 'react';
import { Badge } from '@/types/badge';

interface BadgeDisplayProps {
  badge: Badge | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24'
};

const TEXT_SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'md',
  showName = true,
  className = ''
}) => {
  if (!badge) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`${SIZE_CLASSES[size]} relative overflow-hidden`}>
        <img
          src={badge.image}
          alt={badge.name}
          className="w-full h-full object-contain animate-scale-in"
        />
        {showName && (
          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground px-6 py-1 transform rotate-45 translate-x-4 -translate-y-2 shadow-lg">
            <span className={`${TEXT_SIZE_CLASSES[size]} font-bold whitespace-nowrap`}>
              {badge.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
