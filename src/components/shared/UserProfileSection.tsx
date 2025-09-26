import React from 'react';
import { UniversalAvatar } from './UniversalAvatar';
import { UserTitleBadge } from './UserTitleBadge';
import { UserProfilePopup } from './UserProfilePopup';
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
  greeting,
  variant = 'desktop',
  className
}) => {
  
  // إعداد الإحصائيات للبروفايل
  const profileStats = {
    totalPoints: points,
    level: level,
    joinDate: new Date().toISOString(), // يمكن تحديثها بالتاريخ الفعلي
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // منذ ساعتين كمثال
  };

  if (variant === 'mobile') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <UserProfilePopup 
          profile={{ 
            full_name: userName, 
            email: userEmail, 
            role: role,
            avatar_url: avatarUrl 
          }}
          stats={profileStats}
        >
          <UniversalAvatar
            avatarUrl={avatarUrl}
            userName={userName}
            size={variant === 'mobile' ? 'sm' : 'lg'}
            clickable
          />
        </UserProfilePopup>
        <div className="flex flex-col">
          {greeting && (
            <span className="text-sm text-muted-foreground">{greeting}</span>
          )}
          <h2 className="text-lg font-semibold">{userName}</h2>
          {displayTitle && (
            <UserTitleBadge 
              role={role}
              displayTitle={displayTitle}
              points={points}
              level={level}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <UserProfilePopup 
            profile={{ 
              full_name: userName, 
              email: userEmail, 
              role: role,
              avatar_url: avatarUrl 
            }}
            stats={profileStats}
          >
            <UniversalAvatar
              avatarUrl={avatarUrl}
              userName={userName}
              size="xl"
              className="ring-4 ring-primary/10"
              clickable
            />
          </UserProfilePopup>
        </div>
        <div className="flex-1">
          {greeting && (
            <p className="text-muted-foreground text-sm mb-1">{greeting}</p>
          )}
          <h1 className="text-2xl font-bold">{userName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {displayTitle && (
              <UserTitleBadge 
                role={role}
                displayTitle={displayTitle}
                points={points}
                level={level}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};