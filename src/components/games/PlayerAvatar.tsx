import React from 'react';
import { User, Crown, Star, Zap } from 'lucide-react';

interface PlayerAvatarProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  level?: number;
}

const AVATAR_STYLES = {
  student1: 'bg-gradient-to-br from-blue-400 to-blue-600',
  student2: 'bg-gradient-to-br from-green-400 to-green-600',
  student3: 'bg-gradient-to-br from-purple-400 to-purple-600',
  student4: 'bg-gradient-to-br from-pink-400 to-pink-600',
  student5: 'bg-gradient-to-br from-orange-400 to-orange-600',
  scholar: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
  master: 'bg-gradient-to-br from-red-400 to-red-600'
};

const SIZE_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24'
};

const ICON_SIZES = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  avatarId, 
  size = 'md', 
  showBadge = false,
  level = 1 
}) => {
  const getBadgeIcon = () => {
    if (level >= 10) return Crown;
    if (level >= 5) return Star;
    return Zap;
  };

  const BadgeIcon = getBadgeIcon();
  const avatarStyle = AVATAR_STYLES[avatarId as keyof typeof AVATAR_STYLES] || AVATAR_STYLES.student1;

  return (
    <div className="relative">
      <div className={`
        ${avatarStyle} 
        ${SIZE_CLASSES[size]} 
        rounded-full 
        flex items-center justify-center 
        shadow-lg 
        border-2 border-white
        animate-fade-in
      `}>
        <User className={`${ICON_SIZES[size]} text-white`} />
      </div>
      
      {showBadge && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
          <BadgeIcon className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
};

export default PlayerAvatar;