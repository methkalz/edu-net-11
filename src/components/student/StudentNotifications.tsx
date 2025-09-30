import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentNotifications } from '@/hooks/useStudentNotifications';
import { 
  Bell, 
  MessageCircle, 
  CheckCircle, 
  Clock,
  BookOpen,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const StudentNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useStudentNotifications();

  const handleNotificationClick = async (notification: any) => {
    // تحديد الإشعار كمقروء
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // الانتقال إلى المشروع مع فتح تاب التعليقات
    if (notification.project_id) {
      navigate(`/grade12-project-editor/${notification.project_id}?tab=comments`);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/40 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-10 h-10 mx-auto animate-spin rounded-full border-2 border-primary/20 border-t-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'teacher_comment':
        return <MessageCircle className="w-4 h-4 text-primary" />;
      case 'project_update':
        return <BookOpen className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Card className="border-border/40 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="default" className="mr-1 bg-primary/90">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8 hover:bg-primary/5"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              تحديد الكل
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">لا توجد إشعارات</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              ستظهر هنا تعليقات المعلمين
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    notification.is_read 
                      ? 'bg-background border-border/50 hover:border-border' 
                      : 'bg-primary/5 border-primary/20 hover:border-primary/30'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        notification.is_read 
                          ? 'bg-muted/50' 
                          : 'bg-primary/10'
                      }`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className={`text-sm font-semibold ${
                          notification.is_read ? 'text-foreground/80' : 'text-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mr-2" />
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        notification.is_read ? 'text-muted-foreground' : 'text-foreground/80'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground/80">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNotifications;