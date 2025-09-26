import React from 'react';
import { UniversalAvatar } from './UniversalAvatar';
import { UserTitleBadge } from './UserTitleBadge';
import { cn } from '@/lib/utils';

interface UserProfileSectionProps {
  avatarUrl?: string | null;
  userName?: string;
  userEmail?: string;
  role?: any;
  displayTitle?: string;
  points?: number;
  level?: number;
  greeting?: string;
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  avatarUrl,
  userName,
  userEmail,
  role,
  displayTitle,
  points,
  level,
  greeting = "مرحباً",
  variant = "desktop",
  className
}) => {
  if (variant === 'mobile') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative">
          <UniversalAvatar
            avatarUrl={avatarUrl}
            userName={userName}
            size="md"
            className="shadow-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">
            {greeting}, {userName || userEmail}
          </h2>
          {role && (
            <UserTitleBadge
              role={role}
              displayTitle={displayTitle}
              points={points}
              level={level}
              size="sm"
              variant="outline"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-6", className)}>
      
      {/* Profile Avatar with Overlap Effect */}
      <div className="relative">
        <div className="relative -mb-8 bg-background/90 backdrop-blur-md rounded-full p-1 shadow-2xl border border-border/20">
          <div className="w-32 h-32">
            <UniversalAvatar
              avatarUrl={avatarUrl}
              userName={userName}
              size="xl"
              className="w-full h-full shadow-xl hover:scale-105 transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};