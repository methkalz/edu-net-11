import React from 'react';
import { UserProfilePopup } from './UserProfilePopup';
import { UniversalAvatar } from './UniversalAvatar';

interface ProfilePictureModalProps {
  profile?: any;
  stats?: any;
  avatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * مكون مبسط لعرض صورة البروفايل مع إمكانية النقر لفتح النافذة المنبثقة
 * يمكن استخدامه في أي مكان في التطبيق حيث نريد عرض صورة بروفايل قابلة للنقر
 */
export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  profile,
  stats,
  avatarUrl,
  userName,
  size = 'md',
  className
}) => {
  return (
    <UserProfilePopup 
      profile={profile}
      stats={stats}
    >
      <UniversalAvatar
        avatarUrl={avatarUrl}
        userName={userName}
        size={size}
        className={className}
        clickable
      />
    </UserProfilePopup>
  );
};