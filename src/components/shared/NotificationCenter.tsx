import React from 'react';
import { Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
  hasUrgent?: boolean;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notificationCount = 0,
  onNotificationClick,
  hasUrgent = false,
  className
}) => {
  const getNotificationIcon = () => {
    if (hasUrgent) return AlertCircle;
    if (notificationCount > 0) return Bell;
    return Bell;
  };

  const NotificationIcon = getNotificationIcon();

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={onNotificationClick}
      className={cn(
        "relative transition-all duration-300 hover:bg-secondary/10",
        hasUrgent && "text-destructive hover:text-destructive",
        className
      )}
    >
      <NotificationIcon className={cn(
        "h-4 w-4",
        hasUrgent && "animate-pulse"
      )} />
      
      {notificationCount > 0 && (
        <Badge 
          className={cn(
            "absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center transition-all duration-300",
            hasUrgent 
              ? "bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-primary text-primary-foreground"
          )}
        >
          {notificationCount > 99 ? '99+' : notificationCount}
        </Badge>
      )}
      
      <span className="hidden md:inline mr-2">الإشعارات</span>
    </Button>
  );
};