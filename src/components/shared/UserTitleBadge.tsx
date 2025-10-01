import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Book, Crown, Shield, User } from 'lucide-react';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { useUserTitle } from '@/hooks/useUserTitle';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserTitleBadgeProps {
  role: AppRole;
  displayTitle?: string | null;
  points?: number | null;
  level?: number | null;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
}

const roleIcons = {
  teacher: Book,
  school_admin: Crown,
  superadmin: Shield,
  student: User,
  parent: User
};

const roleColors = {
  teacher: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  school_admin: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  superadmin: 'bg-red-100 text-red-800 hover:bg-red-200',
  student: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  parent: 'bg-green-100 text-green-800 hover:bg-green-200'
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export const UserTitleBadge: React.FC<UserTitleBadgeProps> = ({
  role,
  displayTitle,
  points,
  level,
  showIcon = true,
  size = 'md',
  variant = 'default'
}) => {
  const IconComponent = roleIcons[role] || User;
  
  const { badgeInfo } = useUserTitle({
    role,
    displayTitle,
    points,
    level
  });
  
  // Determine the display text
  const getDisplayText = () => {
    if (displayTitle) return displayTitle;
    
    // Fallback to default role names
    const defaultTitles = {
      teacher: 'معلم',
      school_admin: 'مدير مدرسة',
      superadmin: 'مدير النظام',
      student: 'طالب جديد',
      parent: 'ولي أمر'
    };
    
    return defaultTitles[role] || 'مستخدم';
  };

  // For students, show badge instead of stars
  const renderStudentBadge = () => {
    if (role !== 'student' || !badgeInfo.hasBadge) return null;
    
    return (
      <span className="inline-flex items-center mr-1">
        <BadgeDisplay 
          badge={badgeInfo.badge} 
          size="sm" 
          showName={false}
        />
      </span>
    );
  };

  const badgeContent = (
    <div className="flex items-center gap-1">
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {role === 'student' && renderStudentBadge()}
      <span>{getDisplayText()}</span>
    </div>
  );

  if (variant === 'default') {
    return (
      <Badge 
        className={`${roleColors[role]} ${sizeClasses[size]} font-medium`}
      >
        {badgeContent}
      </Badge>
    );
  }

  return (
    <Badge variant={variant} className={sizeClasses[size]}>
      {badgeContent}
    </Badge>
  );
};