/**
 * Student Presence Card Component
 * 
 * Individual card component for displaying student presence information.
 * Used within the OnlineStudentsWidget and other presence-related UI.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  Monitor, 
  User,
  Smartphone,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { StudentPresence } from '@/hooks/useRealtimePresence';

interface StudentPresenceCardProps {
  student: StudentPresence;
  variant?: 'compact' | 'detailed';
  onClick?: (student: StudentPresence) => void;
  className?: string;
}

export const StudentPresenceCard: React.FC<StudentPresenceCardProps> = ({
  student,
  variant = 'compact',
  onClick,
  className = ''
}) => {
  // Get student status based on last activity
  const getStudentStatus = () => {
    if (!student.is_online) return 'offline';
    
    const lastSeenTime = new Date(student.last_seen_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenTime.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 2) return 'online';
    if (diffMinutes <= 10) return 'idle';
    return 'away';
  };

  // Format current page display
  const formatCurrentPage = (currentPage?: string) => {
    if (!currentPage) return 'غير محدد';
    
    const pageMap: Record<string, string> = {
      '/dashboard': 'الصفحة الرئيسية',
      '/grade10-management': 'الصف العاشر',
      '/grade11-management': 'الصف الحادي عشر',
      '/grade12-management': 'الصف الثاني عشر',
      '/pair-matching': 'لعبة المطابقة',
      '/knowledge-adventure': 'مغامرة المعرفة',
      '/educational-content': 'المحتوى التعليمي'
    };

    return pageMap[currentPage] || currentPage.replace('/', '');
  };

  // Get status badge variant and color
  const getStatusConfig = () => {
    const status = getStudentStatus();
    
    switch (status) {
      case 'online':
        return {
          variant: 'default' as const,
          color: 'bg-green-500',
          text: 'متواجد'
        };
      case 'idle':
        return {
          variant: 'secondary' as const,
          color: 'bg-yellow-500',
          text: 'خامل'
        };
      case 'away':
        return {
          variant: 'outline' as const,
          color: 'bg-orange-500',
          text: 'بعيد'
        };
      case 'offline':
      default:
        return {
          variant: 'destructive' as const,
          color: 'bg-gray-400',
          text: 'غير متواجد'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const lastSeenText = formatDistanceToNow(
    new Date(student.last_seen_at), 
    { addSuffix: true, locale: ar }
  );

  // Get student initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'ط';
    const words = name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return name.slice(0, 2);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(student);
    }
  };

  if (variant === 'compact') {
    return (
      <Card 
        className={`transition-all duration-200 hover:shadow-md ${
          onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
        } ${className}`}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Avatar with status indicator */}
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusConfig.color}`} />
            </div>

            {/* Student info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {student.full_name || 'طالب غير محدد'}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{lastSeenText}</span>
              </div>
              
              {student.current_page && student.is_online && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Monitor className="h-3 w-3" />
                  <span className="truncate">
                    {formatCurrentPage(student.current_page)}
                  </span>
                </div>
              )}
            </div>

            {/* Status badge */}
            <Badge 
              variant={statusConfig.variant}
              className="text-xs px-2 py-1"
            >
              {statusConfig.text}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with avatar and status */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${statusConfig.color}`} />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-base">
                {student.full_name || 'طالب غير محدد'}
              </h3>
              {student.email && (
                <p className="text-sm text-muted-foreground">
                  {student.email}
                </p>
              )}
            </div>

            <Badge 
              variant={statusConfig.variant}
              className="px-3 py-1"
            >
              {statusConfig.text}
            </Badge>
          </div>

          {/* Activity details */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>آخر نشاط</span>
              </div>
              <span className="font-medium">{lastSeenText}</span>
            </div>

            {student.current_page && student.is_online && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  <span>الصفحة الحالية</span>
                </div>
                <span className="font-medium">
                  {formatCurrentPage(student.current_page)}
                </span>
              </div>
            )}

            {student.username && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>اسم المستخدم</span>
                </div>
                <span className="font-medium">{student.username}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentPresenceCard;