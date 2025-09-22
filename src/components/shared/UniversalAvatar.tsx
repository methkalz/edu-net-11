import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalAvatarProps {
  avatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export const UniversalAvatar: React.FC<UniversalAvatarProps> = ({
  avatarUrl,
  userName,
  size = 'md',
  className,
  fallbackIcon: FallbackIcon = User
}) => {
  // Generate initials from user name if available
  const getInitials = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(userName);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={userName || 'User avatar'}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground">
        {initials || <FallbackIcon className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
};