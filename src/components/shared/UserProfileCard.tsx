import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UniversalAvatar } from './UniversalAvatar';
import { UserTitleBadge } from './UserTitleBadge';
import { useUserTitle } from '@/hooks/useUserTitle';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserProfileCardProps {
  profile: Profile;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  showProgress = false,
  size = 'md',
  className
}) => {
  const { title, level, starCount, nextLevelPoints, progressToNextLevel, isStudent } = useUserTitle({
    role: profile.role,
    displayTitle: profile.display_title,
    points: profile.points,
    level: profile.level
  });

  const sizeStyles = {
    sm: {
      card: 'p-3',
      avatar: 'sm' as const,
      name: 'text-sm font-medium',
      email: 'text-xs text-muted-foreground'
    },
    md: {
      card: 'p-4',
      avatar: 'md' as const,
      name: 'text-base font-semibold',
      email: 'text-sm text-muted-foreground'
    },
    lg: {
      card: 'p-6',
      avatar: 'lg' as const,
      name: 'text-lg font-bold',
      email: 'text-base text-muted-foreground'
    }
  };

  const styles = sizeStyles[size];

  return (
    <Card className={className}>
      <CardContent className={styles.card}>
        <div className="flex items-start gap-4">
          <UniversalAvatar
            avatarUrl={profile.avatar_url}
            userName={profile.full_name}
            size={styles.avatar}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`${styles.name} truncate`}>
                {profile.full_name}
              </h3>
              <UserTitleBadge
                role={profile.role}
                displayTitle={profile.display_title}
                points={profile.points}
                level={profile.level}
                size={size === 'lg' ? 'md' : 'sm'}
              />
            </div>
            
            {profile.email && (
              <p className={`${styles.email} truncate`}>
                {profile.email}
              </p>
            )}

            {/* Student progress display */}
            {isStudent && showProgress && profile.points && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>المستوى {level}</span>
                  <span>{profile.points} نقطة</span>
                </div>
                
                {nextLevelPoints && progressToNextLevel !== null && (
                  <div className="space-y-1">
                    <Progress value={progressToNextLevel} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {nextLevelPoints - profile.points} نقطة للمستوى التالي
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};