import React from 'react';
import { Medal, Award, Trophy, Crown, Gem, LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface StudentBadgeProps {
  level: BadgeLevel;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showProgress?: boolean;
  currentPoints?: number;
  requiredPoints?: number;
  isLocked?: boolean;
  showLabel?: boolean;
}

const BADGE_STYLES: Record<BadgeLevel, string> = {
  bronze: 'bg-gradient-to-br from-amber-400 to-orange-500',
  silver: 'bg-gradient-to-br from-gray-300 to-gray-500',
  gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
  platinum: 'bg-gradient-to-br from-purple-400 to-purple-600',
  diamond: 'bg-gradient-to-br from-cyan-400 to-blue-600'
};

const BADGE_ICONS: Record<BadgeLevel, LucideIcon> = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
  platinum: Crown,
  diamond: Gem
};

const BADGE_NAMES: Record<BadgeLevel, string> = {
  bronze: 'البرونز',
  silver: 'الفضة',
  gold: 'الذهب',
  platinum: 'البلاتين',
  diamond: 'الألماس'
};

const SIZE_CLASSES = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const ICON_SIZES = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20'
};

const StudentBadge: React.FC<StudentBadgeProps> = ({ 
  level,
  size = 'md',
  showProgress = false,
  currentPoints = 0,
  requiredPoints = 0,
  isLocked = false,
  showLabel = false
}) => {
  const BadgeIcon = BADGE_ICONS[level];
  const badgeStyle = BADGE_STYLES[level];
  const badgeName = BADGE_NAMES[level];
  
  const progress = requiredPoints > 0 
    ? Math.min(100, (currentPoints / requiredPoints) * 100) 
    : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className={`
          ${badgeStyle} 
          ${SIZE_CLASSES[size]} 
          rounded-full 
          flex items-center justify-center 
          shadow-lg 
          border-4 border-white
          animate-fade-in
          transition-all duration-300
          hover:scale-110
          ${isLocked ? 'opacity-40 grayscale' : ''}
        `}>
          <BadgeIcon className={`${ICON_SIZES[size]} text-white`} />
        </div>
        
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xl">🔒</span>
            </div>
          </div>
        )}
      </div>
      
      {showLabel && (
        <div className="text-center">
          <p className="font-bold text-lg">{badgeName}</p>
          {requiredPoints > 0 && (
            <p className="text-sm text-muted-foreground">
              {isLocked ? `${requiredPoints} نقطة` : `${currentPoints} نقطة`}
            </p>
          )}
        </div>
      )}
      
      {showProgress && requiredPoints > 0 && !isLocked && (
        <div className="w-full max-w-xs space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {currentPoints} / {requiredPoints} نقطة
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentBadge;
