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
  onClick?: () => void;
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

export const UniversalAvatar = React.forwardRef<
  HTMLDivElement,
  UniversalAvatarProps
>(({
  avatarUrl,
  userName,
  size = 'md',
  className,
  fallbackIcon: FallbackIcon = User,
  onClick
}, ref) => {
  // Generate initials from user name if available
  const getInitials = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Get avatar source with proper fallback handling
  const getAvatarSrc = () => {
    if (!avatarUrl) return null;
    
    // If it's already a full path, use it as is
    if (avatarUrl.startsWith('/') || avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    
    // Otherwise, assume it's in the avatars directory
    return `/avatars/${avatarUrl}`;
  };

  const initials = getInitials(userName);
  const avatarSrc = getAvatarSrc();

  return (
    <Avatar 
      ref={ref}
      className={cn(
        sizeClasses[size], 
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      {avatarSrc && (
        <AvatarImage 
          src={avatarSrc}
          alt={userName || 'User avatar'}
          className="object-cover"
          onError={(e) => {
            // Hide the image if it fails to load, fallback will show
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground">
        {initials || <FallbackIcon className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
});

UniversalAvatar.displayName = "UniversalAvatar";